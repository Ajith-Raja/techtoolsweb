#!/bin/bash

# This script starts the Node.js main application and the Python API servers
# Use Ctrl+C to stop all servers

echo "Starting all servers..."

# Start Node.js server in the background
npm run dev &
NODE_PID=$!

# Wait a moment to allow Node.js server to start
sleep 2

# Start Python API Testing server in the background
python start_api_server.py &
API_TESTER_PID=$!

# Start PDF Tools API server in the background
./start_pdf_service.sh &
PDF_TOOLS_PID=$!

echo "All servers are running!"
echo "Main application: http://localhost:5000"
echo "API Testing server: http://localhost:8000"
echo "PDF Tools API: http://localhost:8001"
echo "Press Ctrl+C to stop all servers"

# Trap Ctrl+C and kill all processes
trap "kill $NODE_PID $API_TESTER_PID $PDF_TOOLS_PID; exit" INT

# Wait for any process to exit
wait -n

# Kill remaining processes
kill $NODE_PID $API_TESTER_PID $PDF_TOOLS_PID 2>/dev/null

echo "All servers stopped"