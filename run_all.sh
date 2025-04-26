#!/bin/bash
# Start both the main application and the API server

# Start the API server in the background
./api_server.sh &
API_SERVER_PID=$!

# Start the main application (Node.js)
npm run dev

# When the main application exits, kill the API server
kill $API_SERVER_PID