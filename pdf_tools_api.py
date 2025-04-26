"""
PDF Tools API

This module provides a FastAPI server with multiple PDF processing tools:
- Compress PDF
- Convert PDF to images
- Convert images to PDF
- Extract text from PDF
- Extract images from PDF
- Merge PDFs
- Split PDF
- Add password protection
- Remove password protection
- Add watermark
- Rotate pages
- Reorder pages
- Add page numbers
- Add headers/footers
- PDF to Word conversion

Includes real-time progress tracking via WebSockets.
"""

import os
import io
import tempfile
import uuid
import time
import asyncio
import concurrent.futures
from typing import List, Dict, Optional, Any
from enum import Enum

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont
from fastapi import (
    FastAPI, File, UploadFile, Form, WebSocket, WebSocketDisconnect,
    HTTPException, BackgroundTasks, Query, Body, Depends
)
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Initialize FastAPI
app = FastAPI(title="PDF Tools API", description="API for various PDF manipulation tasks")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create temp directory for file operations
TEMP_DIR = tempfile.gettempdir()
os.makedirs(os.path.join(TEMP_DIR, "pdf_tools"), exist_ok=True)

# In-memory storage for active tasks
active_tasks: Dict[str, Dict[str, Any]] = {}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, task_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[task_id] = websocket

    def disconnect(self, task_id: str):
        if task_id in self.active_connections:
            del self.active_connections[task_id]

    async def send_progress(self, task_id: str, data: Dict[str, Any]):
        if task_id in self.active_connections:
            await self.active_connections[task_id].send_json(data)

manager = ConnectionManager()

# Helper function to get a temporary file path
def get_temp_file(prefix: str, suffix: str) -> str:
    return os.path.join(TEMP_DIR, "pdf_tools", f"{prefix}_{str(uuid.uuid4())}{suffix}")

# Helper function for updating task progress
async def update_progress(task_id: str, progress: int, status: str = "processing", error: str = None):
    if task_id in active_tasks:
        active_tasks[task_id]["progress"] = progress
        active_tasks[task_id]["status"] = status
        active_tasks[task_id]["error"] = error
        
        await manager.send_progress(
            task_id, 
            {
                "task_id": task_id,
                "progress": progress,
                "status": status,
                "error": error
            }
        )

# PDF password model
class PdfPasswordModel(BaseModel):
    owner_password: str
    user_password: Optional[str] = None

# PDF page range model
class PageRange(BaseModel):
    start: int
    end: int

# PDF rotation enum
class Rotation(int, Enum):
    DEGREES_0 = 0
    DEGREES_90 = 90
    DEGREES_180 = 180
    DEGREES_270 = 270

# Page size enum
class PageSize(str, Enum):
    A4 = "a4"
    LETTER = "letter"
    LEGAL = "legal"
    TABLOID = "tabloid"

# Watermark position enum
class WatermarkPosition(str, Enum):
    CENTER = "center"
    TOP_LEFT = "top-left"
    TOP_RIGHT = "top-right"
    BOTTOM_LEFT = "bottom-left"
    BOTTOM_RIGHT = "bottom-right"

# WebSocket endpoint for progress updates
@app.websocket("/ws/pdf/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await manager.connect(task_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(task_id)

# Helper function to create a new task
def create_task() -> str:
    task_id = str(uuid.uuid4())
    active_tasks[task_id] = {
        "id": task_id,
        "progress": 0,
        "status": "created",
        "result_file": None,
        "error": None
    }
    return task_id

# Cleanup task after completion
async def cleanup_task(task_id: str, delay: int = 600):  # 10 minutes default
    await asyncio.sleep(delay)
    if task_id in active_tasks:
        result_file = active_tasks[task_id].get("result_file")
        if result_file and os.path.exists(result_file):
            try:
                os.unlink(result_file)
            except:
                pass
        del active_tasks[task_id]

# 1. Compress PDF
@app.post("/compress-pdf/", description="Compress a PDF file")
async def compress_pdf(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    quality: int = Form(80, description="Compression quality (0-100)")
):
    task_id = create_task()
    background_tasks.add_task(process_compress_pdf, task_id, pdf_file, quality)
    return {"task_id": task_id}

async def process_compress_pdf(task_id: str, pdf_file: UploadFile, quality: int):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("compressed", ".pdf")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Create a new PDF for compressed output
        output_pdf = fitz.open()
        
        for i, page in enumerate(pdf_document):
            # Add page to new document
            new_page = output_pdf.new_page(width=page.rect.width, height=page.rect.height)
            
            # Get page as pixmap
            pix = page.get_pixmap(matrix=fitz.Matrix(1, 1))
            
            # Compress by creating an image and using JPEG compression
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img_bytes = io.BytesIO()
            img.save(img_bytes, format="JPEG", quality=quality)
            img_bytes.seek(0)
            
            # Add image back to new page
            new_page.insert_image(new_page.rect, stream=img_bytes)
            
            # Update progress
            progress = 10 + int(85 * (i + 1) / total_pages)
            await update_progress(task_id, progress)
        
        # Save result
        output_pdf.save(output_path)
        output_pdf.close()
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 2. Convert PDF to Images
@app.post("/pdf-to-images/", description="Convert PDF pages to images")
async def pdf_to_images(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    dpi: int = Form(200, description="Image DPI (150-600)"),
    format: str = Form("png", description="Image format (png, jpg, webp)")
):
    task_id = create_task()
    background_tasks.add_task(process_pdf_to_images, task_id, pdf_file, dpi, format)
    return {"task_id": task_id}

async def process_pdf_to_images(task_id: str, pdf_file: UploadFile, dpi: int, format: str):
    input_path = get_temp_file("input", ".pdf")
    output_dir = get_temp_file("images", "")
    os.makedirs(output_dir, exist_ok=True)
    output_zip = get_temp_file("images", ".zip")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Convert each page to image
        image_files = []
        for i, page in enumerate(pdf_document):
            pix = page.get_pixmap(matrix=fitz.Matrix(dpi/72, dpi/72))
            
            # Convert to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Save as requested format
            img_path = os.path.join(output_dir, f"page_{i+1}.{format}")
            img.save(img_path, format=format.upper())
            image_files.append(img_path)
            
            # Update progress
            progress = 10 + int(80 * (i + 1) / total_pages)
            await update_progress(task_id, progress)
        
        # Create ZIP archive with all images
        import zipfile
        with zipfile.ZipFile(output_zip, 'w') as zipf:
            for file in image_files:
                zipf.write(file, os.path.basename(file))
        
        # Cleanup individual image files
        for file in image_files:
            os.unlink(file)
        os.rmdir(output_dir)
        
        active_tasks[task_id]["result_file"] = output_zip
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_zip):
            os.unlink(output_zip)

# 3. Convert Images to PDF
@app.post("/images-to-pdf/", description="Convert multiple images to a single PDF")
async def images_to_pdf(
    background_tasks: BackgroundTasks,
    images: List[UploadFile] = File(...),
    page_size: PageSize = Form(PageSize.A4),
    margin: int = Form(50, description="Margin in pixels")
):
    task_id = create_task()
    background_tasks.add_task(process_images_to_pdf, task_id, images, page_size, margin)
    return {"task_id": task_id}

async def process_images_to_pdf(task_id: str, images: List[UploadFile], page_size: PageSize, margin: int):
    output_path = get_temp_file("converted", ".pdf")
    temp_images = []
    
    try:
        # Page size dimensions (width, height) in points
        page_sizes = {
            PageSize.A4: (595, 842),
            PageSize.LETTER: (612, 792),
            PageSize.LEGAL: (612, 1008),
            PageSize.TABLOID: (792, 1224)
        }
        page_width, page_height = page_sizes[page_size]
        
        # Create new PDF
        pdf = fitz.open()
        
        total_images = len(images)
        for i, img_file in enumerate(images):
            # Save image to temp file
            img_path = get_temp_file(f"img_{i}", f".{img_file.filename.split('.')[-1]}")
            with open(img_path, "wb") as f:
                content = await img_file.read()
                f.write(content)
            temp_images.append(img_path)
            
            # Open image
            img = Image.open(img_path)
            
            # Calculate scaling to fit within page with margins
            img_width, img_height = img.size
            max_width = page_width - 2 * margin
            max_height = page_height - 2 * margin
            
            scale = min(max_width / img_width, max_height / img_height)
            new_width = int(img_width * scale)
            new_height = int(img_height * scale)
            
            # Create new page
            page = pdf.new_page(width=page_width, height=page_height)
            
            # Calculate position to center image
            x = (page_width - new_width) / 2
            y = (page_height - new_height) / 2
            
            # Insert image
            page.insert_image(fitz.Rect(x, y, x + new_width, y + new_height), filename=img_path)
            
            # Update progress
            progress = 10 + int(85 * (i + 1) / total_images)
            await update_progress(task_id, progress)
        
        # Save PDF
        pdf.save(output_path)
        pdf.close()
        
        # Cleanup temp images
        for img_path in temp_images:
            os.unlink(img_path)
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        for img_path in temp_images:
            if os.path.exists(img_path):
                os.unlink(img_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 4. Extract Text from PDF
@app.post("/extract-text/", description="Extract text from a PDF file")
async def extract_text(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    page_range: Optional[str] = Form(None, description="Page range (e.g., 1-5)")
):
    task_id = create_task()
    background_tasks.add_task(process_extract_text, task_id, pdf_file, page_range)
    return {"task_id": task_id}

async def process_extract_text(task_id: str, pdf_file: UploadFile, page_range: Optional[str]):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("extracted_text", ".txt")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Parse page range
        if page_range:
            parts = page_range.split('-')
            start_page = max(0, int(parts[0]) - 1)  # Convert from 1-based to 0-based
            end_page = min(total_pages, int(parts[1]) if len(parts) > 1 else start_page + 1)
        else:
            start_page = 0
            end_page = total_pages
        
        # Extract text from pages
        with open(output_path, "w", encoding="utf-8") as f:
            for i in range(start_page, end_page):
                page = pdf_document[i]
                text = page.get_text()
                f.write(f"--- Page {i+1} ---\n\n")
                f.write(text)
                f.write("\n\n")
                
                # Update progress
                progress = 10 + int(85 * (i - start_page + 1) / (end_page - start_page))
                await update_progress(task_id, progress)
        
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 5. Extract Images from PDF
@app.post("/extract-images/", description="Extract images from a PDF file")
async def extract_images(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    min_size: int = Form(100, description="Minimum image size in pixels")
):
    task_id = create_task()
    background_tasks.add_task(process_extract_images, task_id, pdf_file, min_size)
    return {"task_id": task_id}

async def process_extract_images(task_id: str, pdf_file: UploadFile, min_size: int):
    input_path = get_temp_file("input", ".pdf")
    output_dir = get_temp_file("images", "")
    os.makedirs(output_dir, exist_ok=True)
    output_zip = get_temp_file("extracted_images", ".zip")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Extract images from each page
        image_files = []
        image_count = 0
        
        for i, page in enumerate(pdf_document):
            # Get image list
            image_list = page.get_images(full=True)
            
            # Process each image
            for j, img in enumerate(image_list):
                xref = img[0]  # image reference
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                
                # Load as PIL Image to check size
                try:
                    img = Image.open(io.BytesIO(image_bytes))
                    if min(img.size) < min_size:
                        continue  # Skip small images
                    
                    # Save image
                    img_path = os.path.join(output_dir, f"image_{image_count}.{base_image['ext']}")
                    with open(img_path, "wb") as f:
                        f.write(image_bytes)
                    image_files.append(img_path)
                    image_count += 1
                except Exception as e:
                    # Skip problematic images
                    continue
            
            # Update progress
            progress = 10 + int(85 * (i + 1) / total_pages)
            await update_progress(task_id, progress)
        
        # Create ZIP archive with all images
        import zipfile
        with zipfile.ZipFile(output_zip, 'w') as zipf:
            for file in image_files:
                zipf.write(file, os.path.basename(file))
        
        # Cleanup individual image files
        for file in image_files:
            os.unlink(file)
        os.rmdir(output_dir)
        
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_zip
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_zip):
            os.unlink(output_zip)

# 6. Merge PDFs
@app.post("/merge-pdfs/", description="Merge multiple PDF files into one")
async def merge_pdfs(
    background_tasks: BackgroundTasks,
    pdf_files: List[UploadFile] = File(...)
):
    task_id = create_task()
    background_tasks.add_task(process_merge_pdfs, task_id, pdf_files)
    return {"task_id": task_id}

async def process_merge_pdfs(task_id: str, pdf_files: List[UploadFile]):
    temp_files = []
    output_path = get_temp_file("merged", ".pdf")
    
    try:
        await update_progress(task_id, 5, "processing")
        
        # Create merged PDF
        merged_pdf = fitz.open()
        
        total_files = len(pdf_files)
        for i, pdf_file in enumerate(pdf_files):
            # Save uploaded file
            input_path = get_temp_file(f"input_{i}", ".pdf")
            with open(input_path, "wb") as f:
                content = await pdf_file.read()
                f.write(content)
            temp_files.append(input_path)
            
            # Open PDF
            pdf_document = fitz.open(input_path)
            
            # Append to merged PDF
            merged_pdf.insert_pdf(pdf_document)
            pdf_document.close()
            
            # Update progress
            progress = 5 + int(90 * (i + 1) / total_files)
            await update_progress(task_id, progress)
        
        # Save merged PDF
        merged_pdf.save(output_path)
        merged_pdf.close()
        
        # Cleanup temp files
        for file in temp_files:
            os.unlink(file)
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        for file in temp_files:
            if os.path.exists(file):
                os.unlink(file)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 7. Split PDF
@app.post("/split-pdf/", description="Split a PDF into multiple files")
async def split_pdf(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    split_method: str = Form("pages", description="Split method: 'pages' or 'ranges'"),
    pages_per_pdf: Optional[int] = Form(None, description="Pages per output PDF"),
    page_ranges: Optional[str] = Form(None, description="Page ranges (e.g., '1-3,4-6,7-9')")
):
    task_id = create_task()
    background_tasks.add_task(process_split_pdf, task_id, pdf_file, split_method, pages_per_pdf, page_ranges)
    return {"task_id": task_id}

async def process_split_pdf(task_id: str, pdf_file: UploadFile, split_method: str, pages_per_pdf: Optional[int], page_ranges: Optional[str]):
    input_path = get_temp_file("input", ".pdf")
    output_dir = get_temp_file("split", "")
    os.makedirs(output_dir, exist_ok=True)
    output_zip = get_temp_file("split_pdfs", ".zip")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Split based on method
        output_files = []
        
        if split_method == "pages" and pages_per_pdf:
            # Split by number of pages per PDF
            for i in range(0, total_pages, pages_per_pdf):
                # Calculate end page
                end = min(i + pages_per_pdf, total_pages)
                
                # Create new PDF
                output_file = os.path.join(output_dir, f"split_{i+1}-{end}.pdf")
                new_pdf = fitz.open()
                
                # Add pages from original PDF
                new_pdf.insert_pdf(pdf_document, from_page=i, to_page=end-1)
                
                # Save new PDF
                new_pdf.save(output_file)
                new_pdf.close()
                output_files.append(output_file)
                
                # Update progress
                progress = 10 + int(85 * (i + pages_per_pdf) / total_pages)
                await update_progress(task_id, min(95, progress))
        
        elif split_method == "ranges" and page_ranges:
            # Split by specified page ranges
            ranges = page_ranges.split(',')
            
            for i, range_str in enumerate(ranges):
                parts = range_str.strip().split('-')
                
                # Parse start and end pages (convert to 0-based)
                start = max(0, int(parts[0]) - 1)
                end = min(total_pages, int(parts[1]) if len(parts) > 1 else start + 1)
                
                # Create new PDF
                output_file = os.path.join(output_dir, f"split_{start+1}-{end}.pdf")
                new_pdf = fitz.open()
                
                # Add pages from original PDF
                new_pdf.insert_pdf(pdf_document, from_page=start, to_page=end-1)
                
                # Save new PDF
                new_pdf.save(output_file)
                new_pdf.close()
                output_files.append(output_file)
                
                # Update progress
                progress = 10 + int(85 * (i + 1) / len(ranges))
                await update_progress(task_id, min(95, progress))
        
        else:
            # Split into individual pages
            for i in range(total_pages):
                # Create new PDF with single page
                output_file = os.path.join(output_dir, f"page_{i+1}.pdf")
                new_pdf = fitz.open()
                
                # Add page from original PDF
                new_pdf.insert_pdf(pdf_document, from_page=i, to_page=i)
                
                # Save new PDF
                new_pdf.save(output_file)
                new_pdf.close()
                output_files.append(output_file)
                
                # Update progress
                progress = 10 + int(85 * (i + 1) / total_pages)
                await update_progress(task_id, min(95, progress))
        
        pdf_document.close()
        
        # Create ZIP archive with all split PDFs
        import zipfile
        with zipfile.ZipFile(output_zip, 'w') as zipf:
            for file in output_files:
                zipf.write(file, os.path.basename(file))
        
        # Cleanup individual PDF files
        for file in output_files:
            os.unlink(file)
        os.rmdir(output_dir)
        
        active_tasks[task_id]["result_file"] = output_zip
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_zip):
            os.unlink(output_zip)

# 8. Add Password Protection
@app.post("/add-password/", description="Add password protection to a PDF")
async def add_password(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    password: PdfPasswordModel = Body(...)
):
    task_id = create_task()
    background_tasks.add_task(process_add_password, task_id, pdf_file, password)
    return {"task_id": task_id}

async def process_add_password(task_id: str, pdf_file: UploadFile, password: PdfPasswordModel):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("protected", ".pdf")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 20, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        
        # Set permissions
        perm = int(
            fitz.PDF_PERM_PRINT |  # allow printing
            fitz.PDF_PERM_COPY |   # allow copying
            fitz.PDF_PERM_ANNOTATE # allow annotations
        )
        
        pdf_document.save(
            output_path,
            encryption=fitz.PDF_ENCRYPT_AES_256,  # strongest encryption
            owner_pw=password.owner_password,
            user_pw=password.user_password or "",
            permissions=perm
        )
        
        pdf_document.close()
        
        await update_progress(task_id, 90, "processing")
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 9. Remove Password Protection
@app.post("/remove-password/", description="Remove password protection from a PDF")
async def remove_password(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    password: str = Form(...)
):
    task_id = create_task()
    background_tasks.add_task(process_remove_password, task_id, pdf_file, password)
    return {"task_id": task_id}

async def process_remove_password(task_id: str, pdf_file: UploadFile, password: str):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("unprotected", ".pdf")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 20, "processing")
        
        # Open PDF with password
        pdf_document = fitz.open(input_path)
        
        # Check if PDF is encrypted
        if pdf_document.is_encrypted:
            # Try to authenticate with password
            if not pdf_document.authenticate(password):
                raise Exception("Incorrect password")
            
            # Save without encryption
            pdf_document.save(output_path)
        else:
            # No password to remove, just copy
            pdf_document.save(output_path)
        
        pdf_document.close()
        
        await update_progress(task_id, 90, "processing")
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 10. Add Watermark
@app.post("/add-watermark/", description="Add text watermark to a PDF")
async def add_watermark(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    watermark_text: str = Form(...),
    position: WatermarkPosition = Form(WatermarkPosition.CENTER),
    opacity: float = Form(0.3, description="Opacity (0.1-1.0)"),
    rotation: int = Form(45, description="Rotation angle in degrees")
):
    task_id = create_task()
    background_tasks.add_task(process_add_watermark, task_id, pdf_file, watermark_text, position, opacity, rotation)
    return {"task_id": task_id}

async def process_add_watermark(task_id: str, pdf_file: UploadFile, watermark_text: str, position: WatermarkPosition, opacity: float, rotation: int):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("watermarked", ".pdf")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Process each page
        for i, page in enumerate(pdf_document):
            # Create watermark with proper rotation and positioning
            font_size = min(page.rect.width, page.rect.height) / 10
            
            # Determine position for watermark
            if position == WatermarkPosition.CENTER:
                x = page.rect.width / 2
                y = page.rect.height / 2
            elif position == WatermarkPosition.TOP_LEFT:
                x = page.rect.width * 0.2
                y = page.rect.height * 0.2
            elif position == WatermarkPosition.TOP_RIGHT:
                x = page.rect.width * 0.8
                y = page.rect.height * 0.2
            elif position == WatermarkPosition.BOTTOM_LEFT:
                x = page.rect.width * 0.2
                y = page.rect.height * 0.8
            elif position == WatermarkPosition.BOTTOM_RIGHT:
                x = page.rect.width * 0.8
                y = page.rect.height * 0.8
            
            # Insert watermark text
            page.insert_text(
                (x, y),
                watermark_text,
                fontsize=font_size,
                rotate=rotation,
                color=(0, 0, 0, opacity * 255),  # RGBA with opacity
                render_mode=2  # Fill with transparency
            )
            
            # Update progress
            progress = 10 + int(85 * (i + 1) / total_pages)
            await update_progress(task_id, progress)
        
        # Save result
        pdf_document.save(output_path)
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 11. Rotate Pages
@app.post("/rotate-pages/", description="Rotate pages in a PDF")
async def rotate_pages(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    angle: Rotation = Form(Rotation.DEGREES_90),
    page_range: Optional[str] = Form(None, description="Page range (e.g., 1-5)")
):
    task_id = create_task()
    background_tasks.add_task(process_rotate_pages, task_id, pdf_file, angle, page_range)
    return {"task_id": task_id}

async def process_rotate_pages(task_id: str, pdf_file: UploadFile, angle: Rotation, page_range: Optional[str]):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("rotated", ".pdf")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Parse page range
        if page_range:
            parts = page_range.split('-')
            start_page = max(0, int(parts[0]) - 1)  # Convert from 1-based to 0-based
            end_page = min(total_pages, int(parts[1]) if len(parts) > 1 else start_page + 1)
        else:
            start_page = 0
            end_page = total_pages
        
        # Rotate pages
        for i in range(start_page, end_page):
            pdf_document[i].set_rotation(angle)
            
            # Update progress
            progress = 10 + int(85 * (i - start_page + 1) / (end_page - start_page))
            await update_progress(task_id, progress)
        
        # Save result
        pdf_document.save(output_path)
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 12. Reorder Pages
@app.post("/reorder-pages/", description="Reorder pages in a PDF")
async def reorder_pages(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    page_order: str = Form(..., description="Comma-separated page numbers (e.g., '3,1,2,4')")
):
    task_id = create_task()
    background_tasks.add_task(process_reorder_pages, task_id, pdf_file, page_order)
    return {"task_id": task_id}

async def process_reorder_pages(task_id: str, pdf_file: UploadFile, page_order: str):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("reordered", ".pdf")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Parse page order (convert from 1-based to 0-based)
        try:
            page_numbers = [int(p.strip()) - 1 for p in page_order.split(',')]
            
            # Validate page numbers
            if any(p < 0 or p >= total_pages for p in page_numbers):
                raise Exception(f"Invalid page numbers. Must be between 1 and {total_pages}.")
        except ValueError:
            raise Exception("Invalid page order format. Use comma-separated page numbers.")
        
        # Create new PDF with reordered pages
        new_pdf = fitz.open()
        
        for i, page_num in enumerate(page_numbers):
            new_pdf.insert_pdf(pdf_document, from_page=page_num, to_page=page_num)
            
            # Update progress
            progress = 10 + int(85 * (i + 1) / len(page_numbers))
            await update_progress(task_id, progress)
        
        # Save result
        new_pdf.save(output_path)
        new_pdf.close()
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 13. Add Page Numbers
@app.post("/add-page-numbers/", description="Add page numbers to a PDF")
async def add_page_numbers(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    position: str = Form("bottom-right", description="Position: 'bottom-right', 'bottom-center', 'bottom-left', 'top-right', 'top-center', 'top-left'"),
    start_number: int = Form(1, description="Starting page number"),
    font_size: int = Form(12, description="Font size")
):
    task_id = create_task()
    background_tasks.add_task(process_add_page_numbers, task_id, pdf_file, position, start_number, font_size)
    return {"task_id": task_id}

async def process_add_page_numbers(task_id: str, pdf_file: UploadFile, position: str, start_number: int, font_size: int):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("page_numbers", ".pdf")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Add page numbers to each page
        for i in range(total_pages):
            page = pdf_document[i]
            page_number = start_number + i
            
            # Determine position
            margin = 30  # margin in points
            
            if position == "bottom-right":
                x = page.rect.width - margin
                y = page.rect.height - margin
                align = fitz.TEXT_ALIGN_RIGHT
            elif position == "bottom-center":
                x = page.rect.width / 2
                y = page.rect.height - margin
                align = fitz.TEXT_ALIGN_CENTER
            elif position == "bottom-left":
                x = margin
                y = page.rect.height - margin
                align = fitz.TEXT_ALIGN_LEFT
            elif position == "top-right":
                x = page.rect.width - margin
                y = margin
                align = fitz.TEXT_ALIGN_RIGHT
            elif position == "top-center":
                x = page.rect.width / 2
                y = margin
                align = fitz.TEXT_ALIGN_CENTER
            elif position == "top-left":
                x = margin
                y = margin
                align = fitz.TEXT_ALIGN_LEFT
            else:
                # Default to bottom right
                x = page.rect.width - margin
                y = page.rect.height - margin
                align = fitz.TEXT_ALIGN_RIGHT
            
            # Insert page number
            page.insert_text(
                (x, y),
                str(page_number),
                fontsize=font_size,
                align=align
            )
            
            # Update progress
            progress = 10 + int(85 * (i + 1) / total_pages)
            await update_progress(task_id, progress)
        
        # Save result
        pdf_document.save(output_path)
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 14. Add Headers/Footers
@app.post("/add-header-footer/", description="Add headers and/or footers to a PDF")
async def add_header_footer(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    header_text: Optional[str] = Form(None, description="Header text"),
    footer_text: Optional[str] = Form(None, description="Footer text"),
    font_size: int = Form(10, description="Font size")
):
    task_id = create_task()
    background_tasks.add_task(process_add_header_footer, task_id, pdf_file, header_text, footer_text, font_size)
    return {"task_id": task_id}

async def process_add_header_footer(task_id: str, pdf_file: UploadFile, header_text: Optional[str], footer_text: Optional[str], font_size: int):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("header_footer", ".pdf")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        # Open PDF
        pdf_document = fitz.open(input_path)
        total_pages = len(pdf_document)
        
        # Add header/footer to each page
        for i in range(total_pages):
            page = pdf_document[i]
            
            # Add header if specified
            if header_text:
                page.insert_text(
                    (page.rect.width / 2, 20),  # Position at top center
                    header_text,
                    fontsize=font_size,
                    align=fitz.TEXT_ALIGN_CENTER
                )
            
            # Add footer if specified
            if footer_text:
                page.insert_text(
                    (page.rect.width / 2, page.rect.height - 20),  # Position at bottom center
                    footer_text,
                    fontsize=font_size,
                    align=fitz.TEXT_ALIGN_CENTER
                )
            
            # Update progress
            progress = 10 + int(85 * (i + 1) / total_pages)
            await update_progress(task_id, progress)
        
        # Save result
        pdf_document.save(output_path)
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# 15. PDF to Word conversion
@app.post("/pdf-to-word/", description="Convert PDF to Word format (Note: Basic conversion only)")
async def pdf_to_word(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...)
):
    task_id = create_task()
    background_tasks.add_task(process_pdf_to_word, task_id, pdf_file)
    return {"task_id": task_id}

async def process_pdf_to_word(task_id: str, pdf_file: UploadFile):
    input_path = get_temp_file("input", ".pdf")
    output_path = get_temp_file("output", ".docx")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await pdf_file.read()
            f.write(content)
        
        await update_progress(task_id, 10, "processing")
        
        try:
            # Try to use python-docx if available
            from docx import Document
            from docx.shared import Inches
            
            # Open PDF
            pdf_document = fitz.open(input_path)
            total_pages = len(pdf_document)
            
            # Create Word document
            doc = Document()
            
            # Process each page
            for i, page in enumerate(pdf_document):
                # Extract text
                text = page.get_text()
                
                # Add text to Word document
                doc.add_paragraph(text)
                
                # Add a page break except for the last page
                if i < total_pages - 1:
                    doc.add_page_break()
                
                # Update progress
                progress = 10 + int(85 * (i + 1) / total_pages)
                await update_progress(task_id, progress)
            
            # Save Word document
            doc.save(output_path)
            
        except ImportError:
            # Fallback to simple text extraction if docx not available
            pdf_document = fitz.open(input_path)
            total_pages = len(pdf_document)
            
            # Extract text from all pages
            text = ""
            for i, page in enumerate(pdf_document):
                text += page.get_text()
                
                # Update progress
                progress = 10 + int(85 * (i + 1) / total_pages)
                await update_progress(task_id, progress)
            
            # Save as text file with .docx extension
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text)
        
        pdf_document.close()
        
        active_tasks[task_id]["result_file"] = output_path
        await update_progress(task_id, 100, "completed")
        
        # Schedule cleanup
        asyncio.create_task(cleanup_task(task_id))
    
    except Exception as e:
        await update_progress(task_id, 0, "error", str(e))
        if os.path.exists(input_path):
            os.unlink(input_path)
        if os.path.exists(output_path):
            os.unlink(output_path)

# Endpoint to get task status
@app.get("/task/{task_id}", description="Get the status of a task")
async def get_task_status(task_id: str):
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return active_tasks[task_id]

# Endpoint to download the result file
@app.get("/download/{task_id}", description="Download the result file")
async def download_result(task_id: str):
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = active_tasks[task_id]
    
    if task["status"] != "completed":
        raise HTTPException(status_code=400, detail="Task not completed")
    
    if not task["result_file"] or not os.path.exists(task["result_file"]):
        raise HTTPException(status_code=404, detail="Result file not found")
    
    # Get original filename from the path
    filename = os.path.basename(task["result_file"])
    
    return FileResponse(
        path=task["result_file"], 
        filename=filename,
        media_type="application/octet-stream"  # Force download
    )

# Health check endpoint
@app.get("/health", description="Health check endpoint")
async def health_check():
    return {"status": "healthy"}

# Run the server when executed directly
if __name__ == "__main__":
    uvicorn.run("pdf_tools_api:app", host="0.0.0.0", port=8001, reload=True)