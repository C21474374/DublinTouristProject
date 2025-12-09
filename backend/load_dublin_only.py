"""
Load Dublin administrative area boundaries into database.
Reads GeoJSON file and creates Area objects for Dublin regions.
Converts coordinates from ITM (Irish Transverse Mercator) to WGS84.

Run with: python load_dublin_only.py
"""

import os
import django
import json
from pyproj import Transformer

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from places.models import Area


def load_dublin_areas():
    """
    Load Dublin administrative boundaries from GeoJSON into database.
    Filters only Dublin city and county councils.
    """
    geojson_file = 'data/ireland/ireland-administrative-boundaries.geojson'
    
    # Check if GeoJSON file exists
    if not os.path.exists(geojson_file):
        print(f"❌ File not found: {geojson_file}")
        return
    
    # Create transformer to convert from ITM (EPSG:2157) to WGS84 (EPSG:4326)
    # ITM = Irish Transverse Mercator (local Irish coordinate system)
    # WGS84 = World Geodetic System (global standard for maps)
    transformer = Transformer.from_crs("EPSG:2157", "EPSG:4326", always_xy=True)
    
    # Read GeoJSON file
    with open(geojson_file, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    # Dublin local authorities to import
    dublin_names = [
        'DUBLIN CITY COUNCIL',
        'SOUTH DUBLIN COUNTY COUNCIL',
        'FINGAL COUNTY COUNCIL',
        'DUN LAOGHAIRE-RATHDOWN COUNTY COUNCIL'
    ]
    
    # Clear existing areas to avoid duplicates
    Area.objects.all().delete()
    count = 0
    
    def convert_coordinates(coords):
        """
        Recursively convert coordinate arrays from ITM to WGS84.
        Handles both individual points and nested coordinate arrays.
        """
        if not coords:
            return coords
        
        # Check if this is a single coordinate pair [x, y]
        if isinstance(coords[0], (int, float)) and len(coords) == 2:
            # Transform from ITM to WGS84 and return [longitude, latitude]
            lon, lat = transformer.transform(coords[0], coords[1])
            return [lon, lat]
        
        # Otherwise recursively convert nested coordinates
        return [convert_coordinates(c) for c in coords]
    
    # Process each feature in GeoJSON
    for feature in geojson_data.get('features', []):
        properties = feature.get('properties', {})
        name = properties.get('LA_NAME', '').strip()
        
        # Skip if not a Dublin area
        if name not in dublin_names:
            continue
        
        geometry = feature.get('geometry', {})
        
        # Convert geometry coordinates based on shape type
        if geometry.get('type') == 'Polygon':
            # Polygon: single ring of coordinates
            geometry['coordinates'] = [convert_coordinates(ring) for ring in geometry['coordinates']]
            coords = geometry['coordinates'][0]
            
        elif geometry.get('type') == 'MultiPolygon':
            # MultiPolygon: multiple separate polygons
            geometry['coordinates'] = [
                [convert_coordinates(ring) for ring in poly]
                for poly in geometry['coordinates']
            ]
            coords = geometry['coordinates'][0][0]
        else:
            # Default to Dublin city center if geometry type unknown
            lat, lon = 53.3498, -6.2603
            coords = []
        
        # Calculate area center from first ring coordinates
        if coords:
            lat = sum(c[1] for c in coords) / len(coords)
            lon = sum(c[0] for c in coords) / len(coords)
        else:
            lat, lon = 53.3498, -6.2603
        
        # Create or retrieve area in database
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
    
    # Print summary statistics
    print(f"\n✅ Loaded {count} Dublin areas")
    print(f"📊 Total areas in database: {Area.objects.count()}")


if __name__ == '__main__':
    load_dublin_areas()