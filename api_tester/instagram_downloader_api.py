from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class InstagramDownloadRequest(BaseModel):
    url: str = Field(..., description="Instagram post/reel URL")
    username: Optional[str] = Field(default=None, description="Instagram username")
    password: Optional[str] = Field(default=None, description="Instagram password")
    sessionid: Optional[str] = Field(default=None, description="Instagram sessionid cookie")


def get_instagram_media_info(request: InstagramDownloadRequest) -> Dict[str, Any]:
    """
    Placeholder implementation:
    Replace this with a real resolver/downloader integration.
    """
    return {
        "success": True,
        "placeholder": True,
        "message": "Instagram media info endpoint is wired. Implement provider logic in api_tester/instagram_downloader_api.py.",
        "input": {
            "url": request.url,
            "has_username": bool(request.username),
            "has_password": bool(request.password),
            "has_sessionid": bool(request.sessionid),
        },
        "media": [],
    }


def download_instagram_media(request: InstagramDownloadRequest) -> Dict[str, Any]:
    """
    Placeholder implementation:
    Replace this with real download/storage logic.
    """
    return {
        "success": True,
        "placeholder": True,
        "message": "Download request accepted in placeholder mode. Add actual download handling in api_tester/instagram_downloader_api.py.",
        "download_id": "placeholder-download-id",
        "input_url": request.url,
    }
