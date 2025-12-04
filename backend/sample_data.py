import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.gis.geos import Point


from places.models import Category, Place, Rating, Itinerary, ItineraryStop
from accounts.models import FavouritePlace, VisitedPlace, TouristProfile
from django.contrib.auth.models import User


print("🌱 Creating sample data...")


# ----------------------------------------------------------
# 1. CREATE SAMPLE USER
# ----------------------------------------------------------
user, created = User.objects.get_or_create(
    username="demo_user",
    defaults={"email": "demo@example.com"}
)
user.set_password("password123")
user.save()

profile, _ = TouristProfile.objects.get_or_create(user=user)


# ----------------------------------------------------------
# 2. CATEGORIES
# ----------------------------------------------------------
categories = [
    ("Museums", "museum"),
    ("Parks", "park"),
    ("Landmarks", "landmark"),
]

category_objects = []
for name, icon in categories:
    cat, _ = Category.objects.get_or_create(name=name, icon=icon)
    category_objects.append(cat)


# ----------------------------------------------------------
# 3. PLACES (DUBLIN EXAMPLES)
# ----------------------------------------------------------
sample_places = [
    {
        "name": "Guinness Storehouse",
        "desc": "Famous Irish brewery tour.",
        "coords": (-6.2860, 53.3419),
        "category": category_objects[0],
        "price": 25.00,
        "time": 90,
        "child_friendly": True,
        "wheelchair": True,
        "capacity": 500,
    },
    {
        "name": "Phoenix Park",
        "desc": "Huge green park with deer.",
        "coords": (-6.3290, 53.3550),
        "category": category_objects[1],
        "price": 0.00,
        "time": 120,
        "child_friendly": True,
        "wheelchair": True,
        "capacity": 2000,
    },
    {
        "name": "Trinity College",
        "desc": "Historic university with the Book of Kells.",
        "coords": (-6.2569, 53.3438),
        "category": category_objects[2],
        "price": 18.00,
        "time": 60,
        "child_friendly": True,
        "wheelchair": True,
        "capacity": 300,
    },
]

place_objects = []
for p in sample_places:
    place, _ = Place.objects.get_or_create(
        name=p["name"],
        defaults={
            "description": p["desc"],
            "category": p["category"],
            "location": Point(p["coords"][0], p["coords"][1]),
            "price": p["price"],
            "time_required": p["time"],
            "child_friendly": p["child_friendly"],
            "wheelchair_access": p["wheelchair"],
            "capacity": p["capacity"],
            "popularity": 0,
        },
    )
    place_objects.append(place)


# ----------------------------------------------------------
# 4. FAVORITE + VISITED
# ----------------------------------------------------------
for place in place_objects:
    FavouritePlace.objects.get_or_create(user=user, place=place)
    VisitedPlace.objects.get_or_create(user=user, place=place)


# ----------------------------------------------------------
# 5. RATINGS
# ----------------------------------------------------------
Rating.objects.get_or_create(
    user=user,
    place=place_objects[0],
    stars=5,
    comment="Fantastic experience!"
)

Rating.objects.get_or_create(
    user=user,
    place=place_objects[1],
    stars=4,
    comment="Beautiful and relaxing."
)


# ----------------------------------------------------------
# 6. ITINERARY + STOPS
# ----------------------------------------------------------
itinerary, _ = Itinerary.objects.get_or_create(
    user=user,
    name="Dublin Highlights",
    defaults={"total_cost": 0, "total_time_minutes": 0},
)

for i, place in enumerate(place_objects, start=1):
    ItineraryStop.objects.get_or_create(
        itinerary=itinerary,
        place=place,
        order=i
    )

print("🌱 Sample data created successfully!")
