from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.http import condition
from django.http import FileResponse
import os

def serve_service_worker(request):
    """Serve service worker with correct MIME type"""
    sw_path = os.path.join(settings.STATIC_ROOT, 'service-worker.js')
    return FileResponse(open(sw_path, 'rb'), content_type='application/javascript')

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("places.urls")),
    path("api/", include("accounts.urls")),
    path("api-auth/", include("rest_framework.urls")),
    path("service-worker.js", serve_service_worker),  # Explicit path BEFORE catch-all
    path("", TemplateView.as_view(template_name="index.html"), name="home"),
    # Catch-all for React Router
    re_path(r"^(?!static/).*$", TemplateView.as_view(template_name="index.html")),
]

# Serve static files FIRST
urlpatterns = static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + urlpatterns
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
