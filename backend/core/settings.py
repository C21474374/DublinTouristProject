"""
Django settings for Dublin Guide backend.
Configures database, authentication, CORS, and API settings.
"""

import os
from pathlib import Path
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# Environment variables with defaults for local development
DEBUG = config('DEBUG', default=True, cast=bool)
SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-production')
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,dublin-guide.onrender.com').split(',')

# CORS configuration - allows frontend to communicate with this API
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:5173,https://dublin-guide.onrender.com'
).split(',')

# Installed applications
INSTALLED_APPS = [
    # Django default apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',  # GeoDjango for PostGIS support
    
    # Third-party packages
    'rest_framework',
    'rest_framework.authtoken',  # Token authentication
    'corsheaders',  # CORS support
    'rest_framework_gis',  # GIS serializers for geographic data
    
    # Project apps
    'places',
    'accounts',
]

# Middleware stack - processes requests/responses
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static file serving
    'corsheaders.middleware.CorsMiddleware',  # CORS headers
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

# Template configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database configuration using PostgreSQL with PostGIS extension
DATABASE_URL = config('DATABASE_URL', default=None)

DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://localhost/tourist',
        conn_max_age=600,
        engine='django.contrib.gis.db.backends.postgis'  # PostGIS backend for geographic queries
    )
}

# Password validation rules
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files configuration for CSS, JS, images
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files configuration for user uploads
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# Production security settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True

# GDAL/PROJ configuration for PostGIS on different OS
import sys

if 'win' not in sys.platform:  # Linux/Production
    os.environ.setdefault('GDAL_LIBRARY_PATH', '/usr/lib/x86_64-linux-gnu')
    os.environ.setdefault('PROJ_LIB', '/usr/share/proj')
else:  # Windows (local development)
    os.environ.setdefault('GDAL_LIBRARY_PATH', os.path.join(os.environ.get('CONDA_PREFIX', ''), 'Library', 'bin'))
    os.environ.setdefault('PROJ_LIB', os.path.join(os.environ.get('CONDA_PREFIX', ''), 'Library', 'share', 'proj'))


