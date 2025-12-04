from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    TouristProfile,
    FavouritePlace,
    VisitedPlace,
    PlacePhoto
)

from places.serializers import PlaceSerializer


# ----------------------------
# TOURIST PROFILE SERIALIZER
# ----------------------------
class TouristProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = TouristProfile
        fields = ["user", "points"]


# ----------------------------
# FAVOURITE PLACE SERIALIZER
# ----------------------------
class FavouritePlaceSerializer(serializers.ModelSerializer):
    place = PlaceSerializer(read_only=True)

    class Meta:
        model = FavouritePlace
        fields = ["id", "place"]


# ----------------------------
# VISITED PLACE SERIALIZER
# ----------------------------
class VisitedPlaceSerializer(serializers.ModelSerializer):
    place = PlaceSerializer(read_only=True)

    class Meta:
        model = VisitedPlace
        fields = ["id", "place", "visited_at"]


# ----------------------------
# PLACE PHOTO SERIALIZER
# ----------------------------
class PlacePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacePhoto
        fields = [
            "id",
            "image",
            "caption",
            "uploaded_at"
        ]
