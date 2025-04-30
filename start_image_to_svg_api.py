"""
Image to SVG Converter API Server Launcher

This script starts the FastAPI server for Image to SVG conversion.
Run this script when you want to use the Image to SVG Converter feature.
"""

import sys
import subprocess
from image_to_svg_api import run_api_server

def check_python_version():
    """Verify that Python 3.8+ is being used"""
    if sys.version_info.major < 3 or (sys.version_info.major == 3 and sys.version_info.minor < 8):
        print("Error: Python 3.8 or higher is required to run this application.")
        print(f"Current Python version: {sys.version_info.major}.{sys.version_info.minor}")
        sys.exit(1)

def start_server():
    """Start the Image to SVG converter API server"""
    check_python_version()
    
    print("Starting Image to SVG Converter API server...")
    print("The server will be available at http://localhost:8002")
    print("Press Ctrl+C to stop the server")
    
    try:
        run_api_server()
    except KeyboardInterrupt:
        print("\nShutting down the server...")
    except Exception as e:
        print(f"Error starting the server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()