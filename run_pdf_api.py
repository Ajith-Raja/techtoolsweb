"""
Run PDF Tools API - Production Version

This script runs the PDF Tools API using uvicorn directly with CORS enabled to allow cross-origin requests.
"""

import sys
import os
import subprocess
import time

def run_api_server():
    try:
        print("Starting PDF Tools API server on port 8001...")
        command = [
            sys.executable, "-c", 
            """
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import importlib.util
import sys

# Import the PDF tools API
spec = importlib.util.spec_from_file_location("pdf_tools_api", "pdf_tools_api.py")
pdf_tools_api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdf_tools_api)

# Get the FastAPI app
app = pdf_tools_api.app

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Run the server
uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
            """
        ]
        
        # Run the server process
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for a moment to check if the server starts successfully
        time.sleep(3)
        if process.poll() is not None:
            # Process exited prematurely
            stdout, stderr = process.communicate()
            print(f"Error starting server: {stderr}")
            return False
            
        print("PDF Tools API server is running at http://localhost:8001")
        print("You can now use the PDF Tools features in the application.")
        print("Press Ctrl+C to stop the server.")
        
        # Keep the server running until Ctrl+C is pressed
        while True:
            try:
                time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down PDF Tools API server...")
                process.terminate()
                process.wait()
                print("Server stopped.")
                break
                
            # Check if process is still running
            if process.poll() is not None:
                stdout, stderr = process.communicate()
                print(f"Server stopped unexpectedly: {stderr}")
                return False
        
        return True
        
    except Exception as e:
        print(f"Error running the PDF Tools API server: {e}")
        return False

if __name__ == "__main__":
    success = run_api_server()
    sys.exit(0 if success else 1)