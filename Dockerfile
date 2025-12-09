# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /build

COPY frontend/app/package*.json ./

RUN npm ci

COPY frontend/app .

RUN npm run build

# Stage 2: Python backend
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

ENV GDAL_CONFIG=/usr/bin/gdal-config
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend code
COPY backend .

# Copy frontend dist to static directory (which Django will collectstatic to staticfiles)
COPY --from=frontend-builder /build/dist ./static

# Copy the index.html to templates
COPY --from=frontend-builder /build/dist/index.html ./templates/index.html

# Collect static files (this will copy from ./static to ./staticfiles)
RUN python manage.py collectstatic --noinput --clear

EXPOSE 8000

CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]