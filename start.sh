#!/bin/bash
# FinGuard AI — Quick Start Script (Mac/Linux)
# Run this from the finguard/ root directory

echo ""
echo "🛡️  FinGuard AI — Starting up..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
  echo "❌ Python 3 not found. Install from https://python.org"
  exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

# Setup backend
echo "📦 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
echo "✅ Backend ready"

# Start backend in background
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "🚀 Backend started (PID $BACKEND_PID)"

# Setup frontend
cd ../frontend
echo "📦 Installing frontend dependencies..."
npm install --silent
echo "✅ Frontend ready"

echo ""
echo "🌐 Opening FinGuard AI..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Start frontend (foreground)
npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
echo "Servers stopped."
