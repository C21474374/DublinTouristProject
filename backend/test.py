import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

from django.contrib.gis.geos import Point

print(Point(-6.26, 53.34))
