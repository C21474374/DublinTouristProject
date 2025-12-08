from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # API endpoints
    path("api/", include("places.urls")),
    path("api/", include("accounts.urls")),
    path("api-auth/", include("rest_framework.urls")),
    
    # Catch-all for frontend - serves index.html for all non-API routes
    path("", TemplateView.as_view(template_name="index.html"), name="home"),
]

# Media (uploads)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
