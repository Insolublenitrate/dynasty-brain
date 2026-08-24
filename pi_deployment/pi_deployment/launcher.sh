#!/bin/bash
# On-Demand Launcher for Fantasy Football Dashboard

APP_DIR="$HOME/fantasy_dashboard"

echo "========================================="
echo " Starting Fantasy Football Dashboard..."
echo "========================================="

# 1. Clear the runway: kill any existing processes on port 3000 (frontend) or 8000 (backend)
echo "Cleaning up any old servers..."
fuser -k 3000/tcp 2>/dev/null
fuser -k 8000/tcp 2>/dev/null
sleep 2

# 2. Start Backend
echo "Starting Python Backend..."
cd "$APP_DIR/backend" || exit 1
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
deactivate

# 3. Start Frontend
echo "Starting Next.js Frontend..."
cd "$APP_DIR/generation-2-dashboard" || exit 1
export NODE_ENV=production
export PORT=3000
npm run start &
FRONTEND_PID=$!

# Wait for Next.js server to be fully ready
echo "Waiting for servers to initialize..."
timeout 30s bash -c 'while ! curl -s http://localhost:3000 > /dev/null; do sleep 1; done'

# 4. Launch Chromium in Kiosk mode
echo "Launching UI..."
BROWSER_CMD="chromium"
if ! command -v chromium &> /dev/null; then
    if command -v chromium-browser &> /dev/null; then
        BROWSER_CMD="chromium-browser"
    fi
fi
$BROWSER_CMD --kiosk --password-store=basic http://localhost:3000

# 5. Cleanup when Chromium is closed
echo "UI closed. Shutting down servers..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
fuser -k 8000/tcp 2>/dev/null

echo "Servers shut down successfully. Ready for next app!"
