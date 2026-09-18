# GridWise LLM — Production VPS Deployment Runbook

Comprehensive, step-by-step guide for deploying GridWise LLM on a fresh **Ubuntu 22.04 / 24.04** or **Debian 12** VPS with Docker, Nginx, and Let's Encrypt HTTPS.

---

## Architecture Overview

```text
               INTERNET
                  │ HTTPS :443
                  ▼
          ┌─────────────────┐
          │  Nginx Reverse  │ (TLS Termination, Rate Limiting, Body Size Cap)
          │  Proxy          │
          └────────┬────────┘
                   │ Internal HTTP :8009
                   ▼
          ┌─────────────────┐
          │  GridWise LLM   │ (Unprivileged container: appuser)
          │  Docker Service │ (PuLP + CBC, FastAPI, In-Memory Rate Limiter)
          └─────────────────┘
```

---

## Step 1: DuckDNS Configuration
Your domain is **`gridwise.duckdns.org`**. In your DuckDNS dashboard:
1. Log in to [DuckDNS](https://www.duckdns.org/).
2. Under the domain `gridwise`, enter your **VPS Public IPv4 address** in the `current ip` box and click **update ip**.
3. Verify that the DNS resolves to your VPS IP:
```bash
ping gridwise.duckdns.org
# Or check DNS resolution:
nslookup gridwise.duckdns.org
```

---

## Step 2: Server Preparation

SSH into your VPS as `root`:
```bash
ssh root@YOUR_VPS_IP
```

Clone the repository and run the setup script:
```bash
cd /root
git clone https://github.com/zenbijoy/gridwise-llm.git
cd gridwise-llm

# Make setup script executable and run it
chmod +x deploy/setup.sh
./deploy/setup.sh
```
`deploy/setup.sh` safely:
- Updates package indexes
- Installs Docker & Docker Compose
- Installs Nginx
- Configures UFW firewall to allow only **22 (SSH)**, **80 (HTTP)**, and **443 (HTTPS)**. Port 8000 remains internal.

---

## Step 3: Application Configuration

Create `.env` from `.env.example`:
```bash
cp .env.example .env
nano .env
```
Fill in your production parameters:
```env
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash
LLM_TIMEOUT_SECONDS=18
SOLVER_TIMEOUT_SECONDS=15
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Rate Limiting & Safety
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60
MAX_REQUEST_BODY_SIZE_BYTES=1048576
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## Step 4: Build and Launch with Docker Compose

```bash
docker compose build
docker compose up -d
```

Verify service health and internal status:
```bash
# Check container status
docker compose ps

# Check internal liveness probe
curl http://127.0.0.1:8009/health
# Expected: {"status":"ok"}

# Check internal readiness probe
curl http://127.0.0.1:8009/ready
# Expected: {"status":"ready"}

# Check container logs
docker compose logs --tail=50
```

---

## Step 5: Configure Nginx Reverse Proxy

Copy the pre-configured Nginx site file (which already has `server_name gridwise.duckdns.org;`):
```bash
cp deploy/nginx/gridwise.conf /etc/nginx/sites-available/gridwise.conf
```

Enable the site and verify Nginx syntax:
```bash
ln -sf /etc/nginx/sites-available/gridwise.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test syntax
nginx -t

# Reload Nginx
systemctl reload nginx
```

Verify HTTP proxying:
```bash
curl http://gridwise.duckdns.org/health
# Expected: {"status":"ok"}
```

---

## Step 6: Secure with Let's Encrypt HTTPS (Certbot)

Install Certbot and obtain a free trusted SSL/TLS certificate for `gridwise.duckdns.org`:
```bash
apt-get install -y certbot python3-certbot-nginx

# Request certificate and auto-configure Nginx with automatic HTTPS redirect
certbot --nginx -d gridwise.duckdns.org --non-interactive --agree-tos -m your_email@example.com --redirect
```

Test automatic certificate renewal:
```bash
certbot renew --dry-run
```

---

## Step 7: External Verification

From your local machine or browser, verify the secured deployment:
```bash
# Liveness probe
curl -i https://gridwise.duckdns.org/health

# Readiness probe
curl -i https://gridwise.duckdns.org/ready

# Frontend Web Application & Swagger Docs
# Open in your browser:
# https://gridwise.duckdns.org/
# https://gridwise.duckdns.org/docs
```

---

## Step 8: VPS System Hardening & Security Recommendations

1. **SSH Key Authentication Only**:
   - Add your public key to `/root/.ssh/authorized_keys`.
   - In `/etc/ssh/sshd_config`, set `PasswordAuthentication no` and reload SSH: `systemctl reload sshd`.
2. **Firewall Isolation**:
   - `ufw status` must show only `22`, `80`, and `443` open.
   - The FastAPI backend binds exclusively to `127.0.0.1:8000`.
3. **Non-Root Execution**:
   - The Docker image runs under unprivileged `appuser` (UID 10001).
4. **Secret Isolation**:
   - Secrets exist strictly in `/root/gridwise-llm/.env` with file permissions `chmod 600 .env`.
   - Never commit `.env` to Git.
5. **Auto-Restart**:
   - Docker Compose uses `restart: unless-stopped` to ensure continuous uptime across server reboots.
