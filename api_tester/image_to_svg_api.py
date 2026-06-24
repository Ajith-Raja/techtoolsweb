"""
Image to SVG Converter API

This module provides conversion helpers used by the main FastAPI app.
The conversion path uses img2vector (or its installed core modules) with
vtracer to generate SVG output.
"""

import base64
import os
import tempfile
import uuid
from io import BytesIO

from PIL import Image
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from img2vector import Img2Vector as Img2VectorEngine
except Exception:
    Img2VectorEngine = None

try:
    import vtracer
except Exception:
    vtracer = None

try:
    from core.preprocessing import preprocess_image as img2vector_preprocess_image
except Exception:
    img2vector_preprocess_image = None

try:
    from models.detector import detect_image_type, get_optimal_params
except Exception:
    detect_image_type = None
    get_optimal_params = None

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


def _choose_preprocessing_level(smoothing: int, edge_detection: bool) -> str:
    if edge_detection:
        return "heavy"
    if smoothing >= 7:
        return "medium"
    if smoothing >= 3:
        return "light"
    return "none"


def _path_precision_from_simplify(simplify: float) -> int:
    simplify = max(0.0, min(10.0, float(simplify)))
    return max(1, min(10, int(round(10.0 - (simplify * 0.9)))))


def _convert_with_img2vector_modules(
    input_path: str,
    output_path: str,
    preprocessing_level: str,
    path_precision: int,
) -> None:
    if not all([detect_image_type, get_optimal_params, vtracer]):
        raise RuntimeError("img2vector dependencies are not available")

    temp_input = input_path
    if preprocessing_level != "none":
        if img2vector_preprocess_image is None:
            raise RuntimeError("img2vector preprocessing module is not available")
        preprocessed_path = os.path.join(TEMP_DIR, f"preprocessed_{uuid.uuid4()}.png")
        img2vector_preprocess_image(input_path, preprocessed_path, preprocessing_level)
        temp_input = preprocessed_path

    image_type = detect_image_type(input_path)
    params = get_optimal_params(image_type).copy()
    params["path_precision"] = path_precision
    params["colormode"] = "color"
    params["hierarchical"] = "cutout"

    vtracer.convert_image_to_svg_py(
        temp_input,
        output_path,
        colormode=params["colormode"],
        hierarchical=params["hierarchical"],
        mode=params["mode"],
        filter_speckle=int(params["filter_speckle"]),
        color_precision=int(params["color_precision"]),
        layer_difference=int(params["layer_difference"]),
        corner_threshold=int(params["corner_threshold"]),
        length_threshold=float(params["length_threshold"]),
        max_iterations=int(params["max_iterations"]),
        splice_threshold=int(params["splice_threshold"]),
        path_precision=int(params["path_precision"]),
    )


def _convert_with_img2vector(
    input_path: str,
    output_path: str,
    smoothing: int,
    edge_detection: bool,
    simplify: float,
) -> None:
    preprocessing_level = _choose_preprocessing_level(smoothing, edge_detection)
    # img2vector preprocessing converts to grayscale; bypass it for color fidelity.
    preprocessing_level = "none"
    path_precision = _path_precision_from_simplify(simplify)

    if Img2VectorEngine is not None:
        converter = Img2VectorEngine()
        conversion_kwargs = {
            "output_path": output_path,
            "auto_optimize": False,
            "preprocessing_level": preprocessing_level,
            "path_precision": path_precision,
            "colormode": "color",
            "hierarchical": "cutout",
        }

        converter.convert(
            input_path,
            **conversion_kwargs,
        )
        return

    _convert_with_img2vector_modules(
        input_path=input_path,
        output_path=output_path,
        preprocessing_level=preprocessing_level,
        path_precision=path_precision,
    )


async def convert_image_to_svg(
    image_file: UploadFile = File(...),
    threshold: int = Form(128, description="Threshold (0-255)"),
    simplify: float = Form(2.0, description="Simplification level (0-10)"),
    smoothing: int = Form(5, description="Smoothing level (0-10)"),
    edge_detection: bool = Form(False, description="Apply edge detection"),
):
    try:
        contents = await image_file.read()
        image = Image.open(BytesIO(contents)).convert("RGBA")

        # Normalize alpha against white to avoid transparent artifacts.
        background = Image.new("RGBA", image.size, (255, 255, 255, 255))
        normalized_image = Image.alpha_composite(background, image).convert("RGB")

        input_filename = f"{uuid.uuid4()}_input.png"
        input_path = os.path.join(TEMP_DIR, input_filename)
        normalized_image.save(input_path, format="PNG")

        filename = f"{uuid.uuid4()}.svg"
        svg_path = os.path.join(TEMP_DIR, filename)

        # Keep threshold in the API contract and fold it into preprocessing intent.
        effective_smoothing = max(0, min(10, smoothing + (2 if threshold < 96 else 0)))
        _convert_with_img2vector(
            input_path=input_path,
            output_path=svg_path,
            smoothing=effective_smoothing,
            edge_detection=edge_detection,
            simplify=simplify,
        )

        with open(svg_path, "r", encoding="utf-8") as f:
            svg_content = f.read()

        preview_filename = f"{filename.split('.')[0]}.png"
        preview_path = os.path.join(TEMP_DIR, preview_filename)
        normalized_image.save(preview_path, format="PNG")

        with open(preview_path, "rb") as f:
            preview_base64 = base64.b64encode(f.read()).decode("utf-8")

        return JSONResponse(
            {
                "success": True,
                "filename": filename,
                "preview": f"data:image/png;base64,{preview_base64}",
                "download_url": f"/download/{filename}",
                "svg_content": svg_content,
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting image: {str(e)}")
