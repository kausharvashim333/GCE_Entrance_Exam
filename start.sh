#!/bin/bash

# Kill existing processes
echo "Killing existing processes..."
pkill -f "node server.js" 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Wait for processes to stop
sleep 2

# Start backend server
echo "Starting backend server..."
cd /Users/apple/Documents/Web_development_classes/entrance_exam/CascadeProjects/2048/server
npm run dev &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend static server (now served by backend)
echo "Frontend is now served by backend at http://localhost:5001"
echo ""
echo "=========================================="
echo "Genius Exam Portal"
echo "=========================================="
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:5001"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for backend process
wait $BACKEND_PID
