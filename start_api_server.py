"""
API Tester Server Launcher

This script starts the FastAPI server for the API Testing tool.
Run this script when you want to use the API Tester feature.
"""

import subprocess
import os
import sys
import time

def check_python_version():
    if sys.version_info < (3, 7):
        print("Error: Python 3.7 or higher is required to run this server.")
        sys.exit(1)

def start_server():
    print("Starting API Tester server...")
    try:
        # Run the FastAPI server
        process = subprocess.Popen(
            [sys.executable, "api_tester/run.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for the server to start
        time.sleep(2)
        if process.poll() is not None:
            # Process exited prematurely
            stdout, stderr = process.communicate()
            print(f"Error starting server: {stderr}")
            sys.exit(1)
            
        print("\nAPI Tester server is running at http://localhost:8000")
        print("You can now use the API Tester feature in the application.")
        print("Press Ctrl+C to stop the server.")
        
        # Keep the server running until Ctrl+C is pressed
        while True:
            try:
                time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down API Tester server...")
                process.terminate()
                process.wait()
                print("Server stopped.")
                sys.exit(0)
            
            # Check if process is still running
            if process.poll() is not None:
                stdout, stderr = process.communicate()
                print(f"Server stopped unexpectedly: {stderr}")
                sys.exit(1)
                
    except Exception as e:
        print(f"Error running the API Tester server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_python_version()
    start_server()