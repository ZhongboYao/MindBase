#!/bin/bash

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo "Servers stopped. You can close this window."
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM

echo "🚀 Starting Recap Plan..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/npm is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

# Setup Python environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "📡 Setting up backend..."
source venv/bin/activate
pip install -r backend/requirements.txt > /dev/null 2>&1

echo "📡 Starting backend server..."
cd backend
# Run uvicorn from backend directory so imports work correctly
../venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

echo "🎨 Setting up frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🎨 Starting frontend server..."
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for servers to be ready..."
sleep 3

# Open browser
echo "🌐 Opening browser..."
open http://localhost:5173

echo ""
echo "✅ Recap Plan is running!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend: http://localhost:8000"
echo ""
echo "⚠️  Do NOT close this window - it will stop your servers."
echo "   Press Ctrl+C when you want to stop the application."
echo ""

# Keep the script running
wait
