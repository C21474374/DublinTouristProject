import os
import django
import json
from pyproj import Transformer

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from places.models import Area

def load_dublin_areas():
    geojson_file = 'data/ireland/ireland-administrative-boundaries.geojson'
    
    if not os.path.exists(geojson_file):
        print(f"❌ File not found: {geojson_file}")
        return
    
    # Create transformer from ITM to WGS84
    transformer = Transformer.from_crs("EPSG:2157", "EPSG:4326", always_xy=True)
    
    with open(geojson_file, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    # Dublin area names to keep
    dublin_names = [
        'DUBLIN CITY COUNCIL',
        'SOUTH DUBLIN COUNTY COUNCIL',
        'FINGAL COUNTY COUNCIL',
        'DUN LAOGHAIRE-RATHDOWN COUNTY COUNCIL'  # Changed from DÚN to DUN
    ]
    
    # Clear existing areas
    Area.objects.all().delete()
    count = 0
    
    def convert_coordinates(coords):
        """Recursively convert coordinates from ITM to WGS84"""
        if not coords:
            return coords
        
        if isinstance(coords[0], (int, float)) and len(coords) == 2:
            lon, lat = transformer.transform(coords[0], coords[1])
            return [lon, lat]
        
        return [convert_coordinates(c) for c in coords]
    
    for feature in geojson_data.get('features', []):
        properties = feature.get('properties', {})
        name = properties.get('LA_NAME', '').strip()
        
        # Only process Dublin areas
        if name not in dublin_names:
            continue
        
        geometry = feature.get('geometry', {})
        
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
            lat, lon = 53.3498, -6.2603
        
        # Create or update with duplicate check
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
            print(f"✅ Created: {name}")
        else:
            print(f"⚠️  Already exists: {name}")
    
    print(f"\n✅ Loaded {count} Dublin areas")
    print(f"📊 Total areas in database: {Area.objects.count()}")

if __name__ == '__main__':
    load_dublin_areas()