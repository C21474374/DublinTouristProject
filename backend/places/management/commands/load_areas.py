from django.core.management.base import BaseCommand
import json
import os
from pyproj import Transformer
from places.models import Area

class Command(BaseCommand):
    help = 'Load Irish areas from GeoJSON file (convert ITM to WGS84)'

    def handle(self, *args, **options):
        geojson_file = 'data/ireland/ireland-administrative-boundaries.geojson'
        
        if not os.path.exists(geojson_file):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {geojson_file}'))
            return
        
        # Create transformer from ITM (EPSG:2157) to WGS84 (EPSG:4326)
        transformer = Transformer.from_crs("EPSG:2157", "EPSG:4326", always_xy=True)
        
        with open(geojson_file, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        Area.objects.all().delete()
        count = 0
        
        def convert_coordinates(coords):
            """Recursively convert all coordinates from ITM to WGS84"""
            if not coords:
                return coords
            
            # Single point [x, y]
            if isinstance(coords[0], (int, float)) and len(coords) == 2:
                lon, lat = transformer.transform(coords[0], coords[1])
                return [lon, lat]
            
            # Array of coordinates
            return [convert_coordinates(c) for c in coords]
        
        for feature in geojson_data.get('features', []):
            properties = feature.get('properties', {})
            geometry = feature.get('geometry', {})
            
            name = properties.get('LA_NAME')
            if not name or name.strip() == '':
                continue
            
            name = name.strip()
            
            # Convert geometry coordinates
            if geometry.get('type') == 'Polygon':
                geometry['coordinates'] = [convert_coordinates(ring) for ring in geometry['coordinates']]
                coords = geometry['coordinates'][0]
                lat = sum(c[1] for c in coords) / len(coords)
                lon = sum(c[0] for c in coords) / len(coords)
            elif geometry.get('type') == 'MultiPolygon':
                geometry['coordinates'] = [
                    [convert_coordinates(ring) for ring in poly]
                    for poly in geometry['coordinates']
                ]
                coords = geometry['coordinates'][0][0]
                lat = sum(c[1] for c in coords) / len(coords)
                lon = sum(c[0] for c in coords) / len(coords)
            else:
                lat, lon = 53.4129, -8.2439
            
            Area.objects.create(
                name=name,
                latitude=lat,
                longitude=lon,
                geojson=geometry
            )
            count += 1
        
        self.stdout.write(self.style.SUCCESS(f'✅ Loaded {count} areas (converted from ITM to WGS84)'))