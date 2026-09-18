#!/usr/bin/env bash
# =============================================================================
# GridWise LLM — Production VPS Setup Script (Ubuntu / Debian)
# Safe, idempotent script to prepare the server for Docker, Compose, and Nginx.
# =============================================================================

set -euo pipefail

echo "=========================================================="
echo "  Preparing VPS for GridWise LLM Deployment"
echo "=========================================================="

# 1. Ensure running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] Please run this script as root or with sudo." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# 2. Update package cache safely
echo "[1/5] Updating package cache..."
apt-get update -y

# 3. Install core dependencies
echo "[2/5] Installing core dependencies..."
apt-get install -y --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw

# 4. Install Docker & Docker Compose if missing
echo "[3/5] Verifying Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "  Installing Docker..."
    apt-get install -y docker.io
    systemctl enable --now docker
else
    echo "  Docker is already installed ($(docker --version))."
fi

if ! docker compose version &> /dev/null; then
    echo "  Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin || true
fi

# 5. Install Nginx if missing
echo "[4/5] Verifying Nginx installation..."
if ! command -v nginx &> /dev/null; then
    echo "  Installing Nginx..."
    apt-get install -y nginx
    systemctl enable --now nginx
else
    echo "  Nginx is already installed."
fi

# 6. Configure UFW Firewall (SSH, HTTP, HTTPS)
echo "[5/5] Configuring firewall (ports 22, 80, 443)..."
ufw allow 22/tcp comment 'SSH' || true
ufw allow 80/tcp comment 'HTTP' || true
ufw allow 443/tcp comment 'HTTPS' || true

# Check if UFW is active; enable if inactive
if ! ufw status | grep -q "Status: active"; then
    echo "  Enabling UFW firewall..."
    echo "y" | ufw enable || true
fi

echo "=========================================================="
echo "  VPS Setup Complete!"
echo "=========================================================="
echo "Next Steps:"
echo " 1. Configure .env with your GEMINI_API_KEY."
echo " 2. Run: docker compose up -d"
echo " 3. Copy deploy/nginx/gridwise.conf to /etc/nginx/sites-available/"
echo " 4. Obtain SSL cert via: certbot --nginx -d gridwise.duckdns.org"
echo "=========================================================="
