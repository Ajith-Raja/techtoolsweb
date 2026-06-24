from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import *
from qrcode.image.styles.colormasks import (
    SolidFillColorMask,
    RadialGradiantColorMask,
    SquareGradiantColorMask,
    HorizontalGradiantColorMask,
    VerticalGradiantColorMask,
)
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageColor
import base64
import uvicorn
import json
from typing import Optional, List
import os

app = FastAPI(title="QR Code Generator API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Available style options
MODULE_DRAWERS = {
    "square": SquareModuleDrawer(),
    "gapped": GappedSquareModuleDrawer(),
    "circle": CircleModuleDrawer(),
    "rounded": RoundedModuleDrawer(),
    "vertical": VerticalBarsDrawer(),
    "horizontal": HorizontalBarsDrawer(),
}

COLOR_MASKS = {
    "solid": SolidFillColorMask,
    "radial": RadialGradiantColorMask,
    "square": SquareGradiantColorMask,
    "horizontal": HorizontalGradiantColorMask,
    "vertical": VerticalGradiantColorMask,
}

@app.get("/styles")
async def get_styles():
    """Get available QR code style options"""
    return {
        "moduleDrawers": list(MODULE_DRAWERS.keys()),
        "colorMasks": list(COLOR_MASKS.keys()),
        "errorCorrectionLevels": ["L", "M", "Q", "H"],
    }

@app.post("/generate")
async def generate_qr_code(
    data: str = Form(...),
    size: int = Form(10),
    border: int = Form(4),
    error_correction: str = Form("M"),
    fill_color: str = Form("#000000"),
    back_color: str = Form("#FFFFFF"),
    module_drawer: str = Form("square"),
    color_mask: str = Form("solid"),
    gradient_start: Optional[str] = Form(None),
    gradient_end: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
):
    """Generate a QR code with custom styling
    
    This endpoint also supports VCard data - the frontend will format the data
    correctly before sending it to this endpoint.
    """
    
    try:
        # Validate error correction level
        error_levels = {
            "L": qrcode.constants.ERROR_CORRECT_L,  # ~7% error tolerance
            "M": qrcode.constants.ERROR_CORRECT_M,  # ~15% error tolerance
            "Q": qrcode.constants.ERROR_CORRECT_Q,  # ~25% error tolerance
            "H": qrcode.constants.ERROR_CORRECT_H,  # ~30% error tolerance
        }
        
        if error_correction not in error_levels:
            raise HTTPException(status_code=400, detail="Invalid error correction level")
        
        # Validate module drawer
        if module_drawer not in MODULE_DRAWERS:
            raise HTTPException(status_code=400, detail="Invalid module drawer style")
            
        # Validate color mask
        if color_mask not in COLOR_MASKS:
            raise HTTPException(status_code=400, detail="Invalid color mask style")
        
        # Prepare color mask with valid kwargs for each mask type
        bg_color = ImageColor.getrgb(back_color)
        fg_color = ImageColor.getrgb(fill_color)

        if color_mask == "solid":
            selected_color_mask = SolidFillColorMask(
                back_color=bg_color,
                front_color=fg_color,
            )
        elif color_mask in ("radial", "square"):
            start_color = ImageColor.getrgb(gradient_start) if gradient_start else fg_color
            end_color = ImageColor.getrgb(gradient_end) if gradient_end else fg_color
            selected_color_mask = COLOR_MASKS[color_mask](
                back_color=bg_color,
                center_color=start_color,
                edge_color=end_color,
            )
        elif color_mask == "horizontal":
            start_color = ImageColor.getrgb(gradient_start) if gradient_start else fg_color
            end_color = ImageColor.getrgb(gradient_end) if gradient_end else fg_color
            selected_color_mask = COLOR_MASKS[color_mask](
                back_color=bg_color,
                left_color=start_color,
                right_color=end_color,
            )
        else:  # vertical
            start_color = ImageColor.getrgb(gradient_start) if gradient_start else fg_color
            end_color = ImageColor.getrgb(gradient_end) if gradient_end else fg_color
            selected_color_mask = COLOR_MASKS[color_mask](
                back_color=bg_color,
                top_color=start_color,
                bottom_color=end_color,
            )
        
        # Create QR code with styling
        qr = qrcode.QRCode(
            version=1,
            error_correction=error_levels[error_correction],
            box_size=size,
            border=border
        )
        
        qr.add_data(data)
        qr.make(fit=True)
        
        qr_image = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=MODULE_DRAWERS[module_drawer],
            color_mask=selected_color_mask,
            fill_color=fill_color,
            back_color=back_color,
        )
        
        # Add logo if provided
        if logo:
            logo_img = Image.open(BytesIO(await logo.read()))
            
            # Calculate logo size (max 30% of QR code)
            qr_width, qr_height = qr_image.size
            logo_max_size = int(min(qr_width, qr_height) * 0.3)
            
            # Resize logo while maintaining aspect ratio
            logo_width, logo_height = logo_img.size
            if logo_width > logo_height:
                logo_height = int(logo_height * (logo_max_size / logo_width))
                logo_width = logo_max_size
            else:
                logo_width = int(logo_width * (logo_max_size / logo_height))
                logo_height = logo_max_size
                
            logo_img = logo_img.resize((logo_width, logo_height))
            
            # Calculate position to center the logo
            pos_x = (qr_width - logo_width) // 2
            pos_y = (qr_height - logo_height) // 2
            
            # Create logo with rounded corners
            logo_img = logo_img.convert("RGBA")
            
            # Paste the logo onto the QR code
            qr_image = qr_image.convert("RGBA")
            qr_image.paste(logo_img, (pos_x, pos_y), logo_img if logo_img.mode == 'RGBA' else None)
        
        # Convert to base64
        buffered = BytesIO()
        qr_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {"image": f"data:image/png;base64,{img_str}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.environ.get("QR_API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)