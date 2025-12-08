# Dublin Guide - Deployment Guide

## Prerequisites

- GitHub account with this repo
- Neon account (neon.tech) for PostgreSQL
- Render account (render.com) for hosting

## Step 1: Set up Neon Database

1. Go to https://neon.tech
2. Sign up and create new project
3. Enable PostGIS extension:
   ```sql
   CREATE EXTENSION postgis;
   CREATE EXTENSION postgis_topology;
   ```
4. Copy connection string: `postgresql://user:pass@host:5432/db`

## Step 2: Generate Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output - you'll need it for Render.

## Step 3: Deploy on Render

1. Go to https://render.com and sign in with GitHub
2. Click **New +** → **Web Service**
3. Select your TouristProject repository
4. Configure:
   - **Name:** dublin-guide
   - **Environment:** Docker
   - **Region:** Ireland (or closest to you)
   - **Plan:** Free

5. Click **Advanced** and add environment variables:
   ```
   SECRET_KEY=<paste-the-key-from-step-2>
   DATABASE_URL=<paste-neon-connection-string>
   DEBUG=False
   ALLOWED_HOSTS=dublin-guide.onrender.com
   CORS_ALLOWED_ORIGINS=https://dublin-guide.onrender.com
   ```

6. Click **Create Web Service**
7. Wait 5-10 minutes for build to complete

## Step 4: Verify Deployment

- Visit `https://dublin-guide.onrender.com` - frontend should load
- Visit `https://dublin-guide.onrender.com/api/places/` - should return JSON
- Visit `https://dublin-guide.onrender.com/admin` - Django admin
- Check PWA features work (install prompt, offline mode)

## Troubleshooting

**Build fails:**
- Check Render logs for error messages
- Make sure requirements.txt has all packages
- Verify Dockerfile syntax

**Database connection error:**
- Check DATABASE_URL is correct
- Verify PostGIS extensions enabled
- Check Neon firewall allows Render

**Static files not loading:**
- Run: `python manage.py collectstatic --noinput`
- Check STATIC_ROOT permissions

**CORS errors:**
- Verify CORS_ALLOWED_ORIGINS matches frontend URL
- Clear browser cache