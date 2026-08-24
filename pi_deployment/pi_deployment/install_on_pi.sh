#!/bin/bash

# Configuration
APP_DIR="$HOME/fantasy_dashboard"
echo "================================================="
echo " Installing Fantasy Football Dashboard on Pi 5   "
echo "================================================="

# 1. System updates and dependencies
echo "[1/3] Updating system and installing base dependencies..."
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip curl psmisc

# 2. Node.js setup
if ! command -v node &> /dev/null
then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed: $(node -v)"
fi

# 3. Backend & Frontend setup
echo "[2/3] Installing dependencies..."
cd "$APP_DIR/backend" || exit 1
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    pip install fastapi "uvicorn[standard]" pandas numpy pyarrow requests SQLAlchemy google-genai
fi
deactivate

cd "$APP_DIR/generation-2-dashboard" || exit 1
npm install
npm run build

# 4. Clean up old systemd services (if they exist from previous installs)
echo "[3/3] Setting up launcher and desktop icon..."
if systemctl list-unit-files 2>/dev/null | grep -q "fantasy-backend.service"; then
    sudo systemctl stop fantasy-backend.service 2>/dev/null
    sudo systemctl disable fantasy-backend.service 2>/dev/null
    sudo rm -f /etc/systemd/system/fantasy-backend.service
fi
if systemctl list-unit-files 2>/dev/null | grep -q "fantasy-frontend.service"; then
    sudo systemctl stop fantasy-frontend.service 2>/dev/null
    sudo systemctl disable fantasy-frontend.service 2>/dev/null
    sudo rm -f /etc/systemd/system/fantasy-frontend.service
fi
sudo systemctl daemon-reload 2>/dev/null

# 5. Fix permissions and Line Endings
LAUNCHER_FILE="$APP_DIR/pi_deployment/launcher.sh"
DESKTOP_FILE="$APP_DIR/pi_deployment/FantasyDashboard.desktop"

sed -i 's/\r$//' "$LAUNCHER_FILE" 2>/dev/null
sed -i 's/\r$//' "$DESKTOP_FILE" 2>/dev/null
chmod +x "$LAUNCHER_FILE"

sed -i "s|__USER_HOME__|$HOME|g" "$DESKTOP_FILE"

mkdir -p "$HOME/Desktop"
cp "$DESKTOP_FILE" "$HOME/Desktop/"
chmod +x "$HOME/Desktop/FantasyDashboard.desktop"

echo "================================================="
echo " Installation Complete! "
echo " Tap the 'Fantasy Dashboard' icon on your desktop to launch."
echo "================================================="
