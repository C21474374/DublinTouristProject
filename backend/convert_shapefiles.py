import shapefile
import json
import os

# Read shapefile
shp_path = 'data/ireland/Planning_Boundary_Data.shp'

if not os.path.exists(shp_path):
    print(f"❌ File not found: {shp_path}")
    print(f"📁 Files in data/ireland/: {os.listdir('data/ireland/')}")
else:
    reader = shapefile.Reader(shp_path)
    
    features = []
    for shape_rec in reader.shapeRecords():
        props = dict(zip([field[0] for field in reader.fields[1:]], shape_rec.record))
        feature = {
            'type': 'Feature',
            'properties': props,
            'geometry': shape_rec.shape.__geo_interface__
        }
        features.append(feature)
    
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    # Save as GeoJSON
    output_path = 'data/ireland/ireland-administrative-boundaries.geojson'
    with open(output_path, 'w') as f:
        json.dump(geojson, f)
    
    print(f"✅ Converted! Saved to {output_path}")
    print(f"📊 Total features: {len(features)}")