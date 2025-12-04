from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import (
    Category,
    Place,
    Rating,
    Itinerary,
    ItineraryStop
)


# ----------------------------
# CATEGORY SERIALIZER
# ----------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "icon"]


# ----------------------------
# PLACE SERIALIZER (GeoJSON for Leaflet)
# ----------------------------
class PlaceSerializer(GeoFeatureModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Place
        geo_field = "location"  # critical for GeoJSON output
        fields = [
            "id",
            "name",
            "description",
            "price",
            "time_required",
            "popularity",
            "child_friendly",
            "wheelchair_access",
            "capacity",
            "created_at",
            "category",
        ]


# ----------------------------
# RATING SERIALIZER
# ----------------------------
class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Rating
        fields = [
            "id",
            "user",
            "place",
            "stars",
            "comment",
            "created_at"
        ]


# ----------------------------
# ITINERARY STOP SERIALIZER
# ----------------------------
class ItineraryStopSerializer(serializers.ModelSerializer):
    place = PlaceSerializer(read_only=True)

    class Meta:
        model = ItineraryStop
        fields = [
            "id",
            "order",
            "arrival_time",
            "departure_time",
            "place"
        ]


# ----------------------------
# ITINERARY SERIALIZER
# ----------------------------
class ItinerarySerializer(serializers.ModelSerializer):
    stops = ItineraryStopSerializer(many=True, read_only=True)

    class Meta:
        model = Itinerary
        fields = [
            "id",
            "name",
            "total_cost",
            "total_time_minutes",
            "created_at",
            "stops",
        ]
