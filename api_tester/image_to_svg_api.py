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
from typing import Optional

import numpy as np
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from skimage import measure
import uvicorn

app = FastAPI(title="Image to SVG Converter API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a temporary directory for storing files
TEMP_DIR = os.path.join(tempfile.gettempdir(), "image_to_svg_converter")
os.makedirs(TEMP_DIR, exist_ok=True)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


def preprocess_image(image: Image.Image, threshold: int, smoothing: int, edge_detection: bool) -> Image.Image:
    """Preprocess image: grayscale, blur, enhance contrast, and apply threshold/edges"""
    image = image.convert("RGB")  # Remove alpha if exists
    grayscale = ImageOps.grayscale(image)

    if smoothing > 0:
        grayscale = grayscale.filter(ImageFilter.GaussianBlur(radius=smoothing / 10))

    enhancer = ImageEnhance.Contrast(grayscale)
    grayscale = enhancer.enhance(1.5)

    if edge_detection:
        grayscale = grayscale.filter(ImageFilter.FIND_EDGES)

    grayscale = grayscale.point(lambda p: 255 if p > threshold else 0)

    return grayscale


def create_svg_path(contours) -> str:
    """Convert contours to SVG path data"""
    paths = []
    for contour in contours:
        if len(contour) < 3:
            continue
        path = f"M{contour[0][1]:.2f},{contour[0][0]:.2f}"
        for point in contour[1:]:
            path += f" L{point[1]:.2f},{point[0]:.2f}"
        path += " Z"
        paths.append(path)
    return " ".join(paths)


def trace_image(image: Image.Image, simplify: float = 2.0) -> str:
    """Trace image contours and generate SVG path data"""
    img_array = np.array(image)
    contours = measure.find_contours(img_array, 0.5)

    if simplify > 0:
        contours = [measure.approximate_polygon(contour, tolerance=simplify) for contour in contours]

    return create_svg_path(contours)


def create_svg(path_data: str, width: int, height: int, color: str = "black") -> str:
    """Create SVG markup with path data"""
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <path d="{path_data}" fill="{color}" />
</svg>"""


async def convert_image_to_svg(
    image_file: UploadFile = File(...),
    threshold: int = Form(128, description="Threshold (0-255)"),
    simplify: float = Form(2.0, description="Simplification level (0-10)"),
    smoothing: int = Form(5, description="Smoothing level (0-10)"),
    edge_detection: bool = Form(False, description="Apply edge detection"),
    fill_color: str = Form("black", description="SVG fill color"),
):
    try:
        contents = await image_file.read()
        image = Image.open(BytesIO(contents)).convert("RGBA")
        width, height = image.size

        # Remove alpha for clean processing
        background = Image.new("RGBA", image.size, (255, 255, 255, 255))
        image = Image.alpha_composite(background, image).convert("RGB")

        processed_image = preprocess_image(image, threshold, smoothing, edge_detection)
        path_data = trace_image(processed_image, simplify)
        svg_content = create_svg(path_data, width, height, fill_color)

        filename = f"{uuid.uuid4()}.svg"
        svg_path = os.path.join(TEMP_DIR, filename)
        with open(svg_path, "w") as f:
            f.write(svg_content)

        preview_filename = f"{filename.split('.')[0]}.png"
        preview_path = os.path.join(TEMP_DIR, preview_filename)
        processed_image.save(preview_path)

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
    file_path = os.path.join(TEMP_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, headers={
        "Content-Disposition": f"attachment; filename={filename}"
    })


def run_api_server():
    uvicorn.run("image_to_svg_api:app", host="0.0.0.0", port=8000, log_level="info")


if __name__ == "__main__":
    run_api_server()
