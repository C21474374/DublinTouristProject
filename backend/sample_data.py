import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from places.models import Category, Place

# Clear existing data
Place.objects.all().delete()
Category.objects.all().delete()

# Create categories
categories_data = [
    'Attraction',
    'Restaurant',
    'Museum',
    'Park',
    'Historical',
    'Nightlife',
]

categories = {}
for cat_name in categories_data:
    cat = Category.objects.create(name=cat_name)
    categories[cat_name] = cat
    print(f"✓ Created category: {cat_name}")

# Dublin places data
places_data = [
    {
        'name': 'Guinness Storehouse',
        'description': 'Famous Irish brewery with the Book of Kells.',
        'latitude': 53.3406,
        'longitude': -6.2853,
        'category': 'Attraction',
        'price': 18.00,
        'time_required': 120,
        'popularity': 5000,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 2000,
    },
    {
        'name': 'Trinity College',
        'description': 'Historic university with the Book of Kells.',
        'latitude': 53.3436,
        'longitude': -6.2545,
        'category': 'Historical',
        'price': 14.00,
        'time_required': 90,
        'popularity': 4500,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 1500,
    },
    {
        'name': 'Phoenix Park',
        'description': 'Huge green park with deer.',
        'latitude': 53.3498,
        'longitude': -6.3603,
        'category': 'Park',
        'price': 0.00,
        'time_required': 120,
        'popularity': 3000,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 5000,
    },
    {
        'name': 'Temple Bar',
        'description': 'Famous traditional Irish pub.',
        'latitude': 53.3426,
        'longitude': -6.2665,
        'category': 'Restaurant',
        'price': 25.00,
        'time_required': 60,
        'popularity': 3500,
        'child_friendly': False,
        'wheelchair_access': True,
        'capacity': 500,
    },
    {
        'name': 'National Museum of Ireland',
        'description': 'Large museum with Irish artifacts and history.',
        'latitude': 53.3416,
        'longitude': -6.2569,
        'category': 'Museum',
        'price': 0.00,
        'time_required': 150,
        'popularity': 2500,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 2000,
    },
    {
        'name': 'Dublin Castle',
        'description': 'Historic castle in the heart of Dublin.',
        'latitude': 53.3415,
        'longitude': -6.2939,
        'category': 'Historical',
        'price': 12.00,
        'time_required': 90,
        'popularity': 4000,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 1500,
    },
    {
        'name': 'Christ Church Cathedral',
        'description': 'Medieval cathedral with Viking history.',
        'latitude': 53.3427,
        'longitude': -6.2713,
        'category': 'Historical',
        'price': 8.00,
        'time_required': 60,
        'popularity': 2000,
        'child_friendly': True,
        'wheelchair_access': False,
        'capacity': 1000,
    },
    {
        'name': 'St. Patricks Cathedral',
        'description': 'Historic cathedral and national treasure.',
        'latitude': 53.3388,
        'longitude': -6.2744,
        'category': 'Historical',
        'price': 8.00,
        'time_required': 60,
        'popularity': 2500,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 800,
    },
    {
        'name': 'The Brazen Head',
        'description': 'Oldest pub in Dublin since 1668.',
        'latitude': 53.3435,
        'longitude': -6.2821,
        'category': 'Nightlife',
        'price': 20.00,
        'time_required': 90,
        'popularity': 1500,
        'child_friendly': False,
        'wheelchair_access': True,
        'capacity': 400,
    },
    {
        'name': 'Smithfield',
        'description': 'Historic market square with restaurants and bars.',
        'latitude': 53.3473,
        'longitude': -6.2841,
        'category': 'Attraction',
        'price': 0.00,
        'time_required': 60,
        'popularity': 1800,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 3000,
    },
    {
        'name': 'Ha Penny Bridge',
        'description': 'Historic pedestrian bridge over River Liffey.',
        'latitude': 53.3467,
        'longitude': -6.2607,
        'category': 'Attraction',
        'price': 0.00,
        'time_required': 15,
        'popularity': 2000,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 5000,
    },
    {
        'name': 'Jameson Distillery',
        'description': 'Historic whiskey distillery with tours.',
        'latitude': 53.3516,
        'longitude': -6.2895,
        'category': 'Attraction',
        'price': 16.00,
        'time_required': 120,
        'popularity': 2200,
        'child_friendly': False,
        'wheelchair_access': True,
        'capacity': 500,
    },
    {
        'name': 'Irish Museum of Modern Art',
        'description': 'Contemporary art museum in historic building.',
        'latitude': 53.3534,
        'longitude': -6.3002,
        'category': 'Museum',
        'price': 0.00,
        'time_required': 120,
        'popularity': 1200,
        'child_friendly': True,
        'wheelchair_access': True,
        'capacity': 1000,
    },
]

# Create places using raw SQL to bypass GIS requirement
from django.db import connection
from django.contrib.gis.geos import Point

for place_data in places_data:
    category_name = place_data.pop('category')
    latitude = place_data.pop('latitude')
    longitude = place_data.pop('longitude')
    
    try:
        # Try with Point (if GDAL works)
        location = Point(longitude, latitude, srid=4326)
        place = Place.objects.create(
            category=categories[category_name],
            location=location,
            **place_data
        )
    except Exception as e:
        # Fallback: create without location
        print(f"⚠ Creating {place_data['name']} without GIS (GDAL issue)")
        place = Place.objects.create(
            category=categories[category_name],
            latitude=latitude,
            longitude=longitude,
            **place_data
        )
    
    print(f"✓ Created place: {place_data['name']}")

print("\n✅ Database seeding complete!")
print(f"Created {Place.objects.count()} places")