#!/bin/bash

# Start PDF Tools API Service
# This script starts the FastAPI server for PDF tools with CORS enabled

echo "Starting PDF Tools API server on port 8001..."

# Kill any existing process on port 8001
fuser -k 8001/tcp 2>/dev/null

# Create necessary temp directories
mkdir -p ./temp/uploads ./temp/results

# Start the PDF API server
python run_pdf_api.py