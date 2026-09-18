# Stage 1: Build React Frontend
FROM node:22-slim AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.11-slim

# Install coinor-cbc solver and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    coinor-cbc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged user
RUN useradd -u 10001 -m -s /bin/bash appuser

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source and built frontend assets
COPY app ./app
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Set file ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Healthcheck configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-8000}/health || exit 1

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

