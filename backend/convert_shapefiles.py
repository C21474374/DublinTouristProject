"""
Convert ESRI shapefiles to GeoJSON format.
Reads Irish administrative boundary shapefile and converts to GeoJSON.

Shapefile source: Irish government planning data
Output: GeoJSON for use in geographic queries
"""

import shapefile
import json
import os

# Path to shapefile (ESRI format)
shp_path = 'data/ireland/Planning_Boundary_Data.shp'

# Check if shapefile exists
if not os.path.exists(shp_path):
    print(f"❌ File not found: {shp_path}")
    print(f"📁 Files in data/ireland/: {os.listdir('data/ireland/')}")
else:
    # Open shapefile reader
    reader = shapefile.Reader(shp_path)
    
    # Convert each shape to GeoJSON feature
    features = []
    for shape_rec in reader.shapeRecords():
        # Extract properties from shapefile record
        props = dict(zip([field[0] for field in reader.fields[1:]], shape_rec.record))
        
        # Create GeoJSON feature object
        feature = {
            'type': 'Feature',
            'properties': props,
            'geometry': shape_rec.shape.__geo_interface__
        }
        features.append(feature)
    
    # Create GeoJSON FeatureCollection
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    # Save converted GeoJSON to file
    output_path = 'data/ireland/ireland-administrative-boundaries.geojson'
    with open(output_path, 'w') as f:
        json.dump(geojson, f)
    
    print(f"✅ Converted! Saved to {output_path}")
    print(f"📊 Total features: {len(features)}")