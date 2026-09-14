#!/bin/bash

# Get the directory of the current script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting Ennigma Backend Server..."
cd "$DIR/server"
npm run dev &
SERVER_PID=$!

echo "Starting Ennigma Frontend Client..."
cd "$DIR/client"
npm run dev &
CLIENT_PID=$!

echo "=========================================="
echo "Ennigma Application is running!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo "=========================================="
echo "Close this terminal window or press Ctrl+C to stop both servers."

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $SERVER_PID
    kill $CLIENT_PID
    exit
}

# Trap termination signals
trap cleanup SIGINT SIGTERM

# Keep the script running
wait
