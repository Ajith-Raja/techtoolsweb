"""
Run PDF Tools API - Production Version

This script runs the PDF Tools API using uvicorn directly without the interactive wrapper.
"""

import uvicorn
import sys
import os

if __name__ == "__main__":
    try:
        # Run the FastAPI server directly with uvicorn
        uvicorn.run(
            "pdf_tools_api:app",
            host="0.0.0.0",
            port=8001,
            log_level="info"
        )
    except Exception as e:
        print(f"Error running the PDF Tools API server: {e}")
        sys.exit(1)