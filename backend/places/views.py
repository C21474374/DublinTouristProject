# places/views.py


from django.shortcuts import get_object_or_404
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance

from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied

from .models import Category, Place, Rating, Itinerary, ItineraryStop
from .serializers import (
    CategorySerializer,
    PlaceSerializer,
    PlaceDetailSerializer,
    RatingSerializer,
    ItinerarySerializer,
    ItineraryStopSerializer,
)

import os
import csv
from django.conf import settings
from kaggle.api.kaggle_api_extended import KaggleApi


# ---------------------------------------------------
# CATEGORY LIST
# ---------------------------------------------------
class CategoryListAPIView(generics.ListAPIView):
    """
    GET /api/categories/
    """
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


# ---------------------------------------------------
# PLACE LIST WITH FILTERS
# ---------------------------------------------------
class PlaceListAPIView(generics.ListAPIView):
    """
    GET /api/places/
      ?category=<id>
      ?child_friendly=true
      ?wheelchair_access=true
    """
    serializer_class = PlaceDetailSerializer  # Change to PlaceListSerializer

    def get_queryset(self):
        qs = Place.objects.select_related("category").all()

        params = self.request.query_params

        category_id = params.get("category")
        child_friendly = params.get("child_friendly")
        wheelchair_access = params.get("wheelchair_access")
        price_min = params.get("price_min")
        price_max = params.get("price_max")
        capacity_min = params.get("capacity_min")
        ordering = params.get("ordering")

        if category_id:
            qs = qs.filter(category_id=category_id)

        if child_friendly in ("true", "1"):
            qs = qs.filter(child_friendly=True)

        if wheelchair_access in ("true", "1"):
            qs = qs.filter(wheelchair_access=True)

        if price_min:
            qs = qs.filter(price__gte=price_min)

        if price_max:
            qs = qs.filter(price__lte=price_max)

        if capacity_min:
            qs = qs.filter(capacity__gte=capacity_min)

        # Safe ordering options
        allowed_orderings = {
            "popularity",
            "-popularity",
            "price",
            "-price",
            "created_at",
            "-created_at",
        }
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-popularity")

        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ---------------------------------------------------
# PLACE DETAIL
# ---------------------------------------------------
class PlaceDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/places/<id>/
    """
    queryset = Place.objects.select_related("category")
    serializer_class = PlaceDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ---------------------------------------------------
# NEARBY PLACES (PostGIS distance)
# ---------------------------------------------------
class NearbyPlaceListAPIView(generics.ListAPIView):
    """
    GET /api/places/nearby/?lat=53.3498&lng=-6.2603&radius_km=5
    Returns places within radius_km of the given point,
    ordered by distance.
    """
    serializer_class = PlaceDetailSerializer

    def get_queryset(self):
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius_km = self.request.query_params.get("radius_km", 5)

        if not lat or not lng:
            # No coordinates → no results
            return Place.objects.none()

        try:
            lat = float(lat)
            lng = float(lng)
            radius_km = float(radius_km)
        except ValueError:
            return Place.objects.none()

        user_point = Point(lng, lat, srid=4326)

        qs = (
            Place.objects
            .annotate(distance=Distance("location", user_point))
            .filter(location__distance_lte=(user_point, D(km=radius_km)))
            .order_by("distance")
            .select_related("category")
        )
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ---------------------------------------------------
# RATINGS: CREATE FOR A PLACE
# ---------------------------------------------------
class RatingCreateAPIView(generics.CreateAPIView):
    """
    POST /api/places/{place_id}/ratings/create/
    {
        "stars": 5,
        "comment": "Amazing place!"
    }
    """
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        place_id = self.kwargs.get('place_id')
        
        # Check if user already rated this place
        existing_rating = Rating.objects.filter(
            user=request.user,
            place_id=place_id
        ).first()
        
        if existing_rating:
            serializer = self.get_serializer(existing_rating, data=request.data, partial=True)
        else:
            request.data['place'] = place_id
            serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------
# RATINGS: LIST FOR A PLACE
# ---------------------------------------------------
class RatingListAPIView(generics.ListAPIView):
    """
    GET /api/places/{place_id}/ratings/
    """
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        place_id = self.kwargs.get('place_id')
        return Rating.objects.filter(place_id=place_id).select_related('user', 'place').order_by('-created_at')


# ---------------------------------------------------
# SINGLE RATING: RETRIEVE / UPDATE / DELETE
# ---------------------------------------------------
class RatingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/ratings/{id}/
    PATCH  /api/ratings/{id}/
    DELETE /api/ratings/{id}/
    """
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]
    queryset = Rating.objects.select_related("user", "place")

    def perform_update(self, serializer):
        if serializer.instance.user != self.request.user:
            raise PermissionDenied("You can only edit your own ratings.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied("You can only delete your own ratings.")
        instance.delete()


# ---------------------------------------------------
# ITINERARIES (LIST + CREATE FOR CURRENT USER)
# ---------------------------------------------------
class ItineraryListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/itineraries/
    POST /api/itineraries/
    """
    serializer_class = ItinerarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Itinerary.objects
            .filter(user=self.request.user)
            .prefetch_related("stops__place")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ---------------------------------------------------
# SINGLE ITINERARY (RETRIEVE / UPDATE / DELETE)
# ---------------------------------------------------
class ItineraryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/itineraries/<id>/
    PATCH  /api/itineraries/<id>/
    DELETE /api/itineraries/<id>/
    """
    serializer_class = ItinerarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # User can only access their own itineraries
        return (
            Itinerary.objects
            .filter(user=self.request.user)
            .prefetch_related("stops__place")
        )


# ---------------------------------------------------
# EXTRA SERIALIZER FOR WRITING ITINERARY STOPS
# ---------------------------------------------------
class ItineraryStopWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItineraryStop
        fields = ["id", "order", "arrival_time", "departure_time", "place"]


# ---------------------------------------------------
# ITINERARY STOPS: LIST + CREATE FOR A GIVEN ITINERARY
# ---------------------------------------------------
class ItineraryStopListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/itineraries/<itinerary_id>/stops/
    POST /api/itineraries/<itinerary_id>/stops/
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        itinerary_id = self.kwargs["itinerary_id"]
        return (
            ItineraryStop.objects
            .filter(itinerary__id=itinerary_id, itinerary__user=self.request.user)
            .select_related("place")
        )

    def get_serializer_class(self):
        # Use write serializer for POST, read serializer for GET
        if self.request.method == "POST":
            return ItineraryStopWriteSerializer
        return ItineraryStopSerializer

    def perform_create(self, serializer):
        itinerary_id = self.kwargs["itinerary_id"]
        itinerary = get_object_or_404(Itinerary, id=itinerary_id, user=self.request.user)
        serializer.save(itinerary=itinerary)


# ---------------------------------------------------
# SINGLE ITINERARY STOP (RETRIEVE / UPDATE / DELETE)
# ---------------------------------------------------
class ItineraryStopDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/itinerarystops/<id>/
    PATCH  /api/itinerarystops/<id>/
    DELETE /api/itinerarystops/<id>/
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            ItineraryStop.objects
            .filter(itinerary__user=self.request.user)
            .select_related("place", "itinerary")
        )

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return ItineraryStopWriteSerializer
        return ItineraryStopSerializer


