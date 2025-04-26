#!/bin/bash

# This script starts both the Node.js main application and the Python API Testing server
# Use Ctrl+C to stop both servers

echo "Starting both servers..."

# Start Node.js server in the background
npm run dev &
NODE_PID=$!

# Wait a moment to allow Node.js server to start
sleep 2

# Start Python API server in the background
python start_api_server.py &
PYTHON_PID=$!

echo "Both servers are running!"
echo "Main application: http://localhost:5001"
echo "API Testing server: http://localhost:8000"
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C and kill both processes
trap "kill $NODE_PID $PYTHON_PID; exit" INT

# Wait for any process to exit
wait -n

# Kill remaining processes
kill $NODE_PID $PYTHON_PID 2>/dev/null

echo "All servers stopped"