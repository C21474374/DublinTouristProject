from django.core.management.base import BaseCommand
import json
import os
from places.models import Area

class Command(BaseCommand):
    help = 'Load Irish areas from GeoJSON file'

    def handle(self, *args, **options):
        geojson_file = 'data/ireland/ireland-administrative-boundaries.geojson'
        
        if not os.path.exists(geojson_file):
            self.stdout.write(self.style.ERROR(f'❌ File not found: {geojson_file}'))
            return
        
        with open(geojson_file, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        Area.objects.all().delete()
        count = 0
        skipped = 0
        
        for feature in geojson_data.get('features', []):
            properties = feature.get('properties', {})
            geometry = feature.get('geometry', {})
            
            # Extract area name from LA_NAME property
            name = properties.get('LA_NAME')
            if not name or name.strip() == '':
                skipped += 1
                continue
            
            name = name.strip()
            
            # Get center coordinates
            if geometry.get('type') == 'Polygon':
                coords = geometry['coordinates'][0]
                if coords:
                    lat = sum(c[1] for c in coords) / len(coords)
                    lon = sum(c[0] for c in coords) / len(coords)
                else:
                    lat, lon = 53.4129, -8.2439
            elif geometry.get('type') == 'MultiPolygon':
                coords = geometry['coordinates'][0][0]
                if coords:
                    lat = sum(c[1] for c in coords) / len(coords)
                    lon = sum(c[0] for c in coords) / len(coords)
                else:
                    lat, lon = 53.4129, -8.2439
            else:
                lat, lon = 53.4129, -8.2439
            
            # Create area
            area, created = Area.objects.get_or_create(
                name=name,
                defaults={
                    'latitude': lat,
                    'longitude': lon,
                    'geojson': geometry
                }
            )
            
            if created:
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'✅ Loaded {count} areas'))
        if skipped:
            self.stdout.write(self.style.WARNING(f'⚠️  Skipped {skipped} areas'))