"""
Image to SVG Converter API

This module provides a FastAPI server with functionality to convert uploaded images to SVG format.
The conversion uses edge detection and vectorization techniques to create clean, scalable SVG files.
"""

import os
import base64
import uuid
import tempfile
from io import BytesIO
from typing import Dict, Any, Optional

import numpy as np
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from skimage import measure, filters, morphology, feature, color
import uvicorn

app = FastAPI(title="Image to SVG Converter API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a temporary directory for storing files
TEMP_DIR = os.path.join(tempfile.gettempdir(), "image_to_svg_converter")
os.makedirs(TEMP_DIR, exist_ok=True)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


def preprocess_image(image: Image.Image, threshold: int, smoothing: int, edge_detection: bool) -> Image.Image:
    """Preprocess the image to enhance edges and contrast before conversion"""
    # Convert to grayscale
    grayscale = ImageOps.grayscale(image)
    
    # Apply smoothing if needed
    if smoothing > 0:
        grayscale = grayscale.filter(ImageFilter.GaussianBlur(radius=smoothing / 10))
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(grayscale)
    grayscale = enhancer.enhance(1.5)
    
    # Apply edge detection if requested
    if edge_detection:
        grayscale = grayscale.filter(ImageFilter.FIND_EDGES)
    
    # Apply threshold
    threshold_value = threshold / 100 * 255
    grayscale = grayscale.point(lambda p: 255 if p > threshold_value else 0)
    
    return grayscale


def create_svg_path(contours) -> str:
    """Convert contours to SVG path data"""
    paths = []
    for contour in contours:
        if len(contour) < 3:  # Skip small contours
            continue
            
        # Start the path
        path = f"M{contour[0][1]},{contour[0][0]}"
        
        # Add line segments
        for point in contour[1:]:
            path += f" L{point[1]},{point[0]}"
        
        # Close the path
        path += " Z"
        paths.append(path)
    
    return " ".join(paths)


def trace_image(image: Image.Image, simplify: float = 2.0) -> str:
    """Trace image contours and generate SVG path data"""
    # Convert PIL Image to numpy array
    img_array = np.array(image)
    
    # Find contours using Scikit-image
    contours = measure.find_contours(img_array, 0.5)
    
    # Simplify contours
    if simplify > 0:
        contours = [measure.approximate_polygon(contour, tolerance=simplify) for contour in contours]
    
    # Convert contours to SVG path data
    path_data = create_svg_path(contours)
    
    return path_data


def create_svg(path_data: str, width: int, height: int, color: str = "black") -> str:
    """Create the final SVG markup with path data"""
    svg = f"""<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <path d="{path_data}" fill="{color}" />
</svg>"""
    return svg


@app.post("/convert")
async def convert_image_to_svg(
    image_file: UploadFile = File(...),
    threshold: int = Form(128, description="Threshold value (0-255)"),
    simplify: float = Form(2.0, description="Simplification level (0-10)"),
    smoothing: int = Form(5, description="Smoothing level (0-10)"),
    edge_detection: bool = Form(False, description="Apply edge detection"),
    fill_color: str = Form("black", description="SVG fill color"),
):
    """Convert an uploaded image to SVG"""
    try:
        # Read the uploaded file
        contents = await image_file.read()
        image = Image.open(BytesIO(contents))
        
        # Get image dimensions
        width, height = image.size
        
        # Preprocess the image
        processed_image = preprocess_image(image, threshold, smoothing, edge_detection)
        
        # Trace the image and generate SVG path data
        path_data = trace_image(processed_image, simplify)
        
        # Create SVG
        svg_content = create_svg(path_data, width, height, fill_color)
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.svg"
        file_path = os.path.join(TEMP_DIR, filename)
        
        # Save SVG to file
        with open(file_path, "w") as f:
            f.write(svg_content)
        
        # Create a preview image (PNG) from the processed image
        preview_filename = f"{filename.split('.')[0]}.png"
        preview_path = os.path.join(TEMP_DIR, preview_filename)
        processed_image.save(preview_path)
        
        # Convert preview to base64 for embedding in response
        with open(preview_path, "rb") as f:
            preview_base64 = base64.b64encode(f.read()).decode("utf-8")
        
        return JSONResponse({
            "success": True,
            "filename": filename,
            "preview": f"data:image/png;base64,{preview_base64}",
            "download_url": f"/download/{filename}",
            "svg_content": svg_content
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting image: {str(e)}")


@app.get("/download/{filename}")
async def download_svg(filename: str):
    """Download a generated SVG file"""
    file_path = os.path.join(TEMP_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        file_path,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def run_api_server():
    """Run the FastAPI server"""
    uvicorn.run("image_to_svg_api:app", host="0.0.0.0", port=8002, log_level="info")


if __name__ == "__main__":
    run_api_server()