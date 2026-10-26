#!/usr/bin/env bash
# Start MongoDB container if using Docker
docker start mongodb 2>/dev/null || true

# Trap Ctrl+C to stop both backend and frontend cleanly
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  kill $BACKEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "🌿 Starting Smart Tea Plantation AIoT Backend (Port 4000)..."
(cd backend && node server.js) &
BACKEND_PID=$!

# Give backend a moment to initialize
sleep 2

echo "🌿 Starting Frontend Development Server (Port 3000)..."
(cd frontend && npm start)
