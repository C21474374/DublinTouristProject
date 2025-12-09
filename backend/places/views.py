# places/views.py

from django.shortcuts import get_object_or_404
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.db.models.functions import Distance

from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied

from .models import Category, Place, Rating, Itinerary, ItineraryStop, Area
from .serializers import (
    CategorySerializer,
    PlaceSerializer,
    PlaceDetailSerializer,
    RatingSerializer,
    ItinerarySerializer,
    ItineraryStopSerializer,
    ItineraryStopWriteSerializer,
    AreaSerializer,
)


class CategoryListAPIView(generics.ListAPIView):
    """
    List all place categories.
    GET /api/categories/
    
    Returns categories sorted alphabetically.
    """
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


class PlaceListAPIView(generics.ListAPIView):
    """
    List places with optional filtering.
    GET /api/places/
    
    Query Parameters:
    - category (int): Filter by category ID
    - child_friendly (bool): true/1 for child-friendly places
    - wheelchair_access (bool): true/1 for wheelchair accessible
    - price_min (float): Minimum price
    - price_max (float): Maximum price
    - capacity_min (int): Minimum capacity
    - ordering (str): Sort by popularity/price/created_at (prefix with - for descending)
    """
    serializer_class = PlaceDetailSerializer

    def get_queryset(self):
        qs = Place.objects.select_related("category").all()
        params = self.request.query_params

        # Extract filter parameters
        category_id = params.get("category")
        child_friendly = params.get("child_friendly")
        wheelchair_access = params.get("wheelchair_access")
        price_min = params.get("price_min")
        price_max = params.get("price_max")
        capacity_min = params.get("capacity_min")
        ordering = params.get("ordering")

        # Apply category filter
        if category_id:
            qs = qs.filter(category_id=category_id)

        # Apply child friendly filter
        if child_friendly in ("true", "1"):
            qs = qs.filter(child_friendly=True)

        # Apply wheelchair accessibility filter
        if wheelchair_access in ("true", "1"):
            qs = qs.filter(wheelchair_access=True)

        # Apply price range filters
        if price_min:
            qs = qs.filter(price__gte=price_min)
        if price_max:
            qs = qs.filter(price__lte=price_max)

        # Apply capacity filter
        if capacity_min:
            qs = qs.filter(capacity__gte=capacity_min)

        # Apply ordering with whitelist for security
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
        """Pass request to serializer for user context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class PlaceDetailAPIView(generics.RetrieveAPIView):
    """
    Get detailed information about a specific place.
    GET /api/places/<id>/
    
    Returns place details including ratings, average rating, and user's own rating.
    """
    queryset = Place.objects.select_related("category")
    serializer_class = PlaceDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        """Pass request to serializer for user context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class NearbyPlaceListAPIView(generics.ListAPIView):
    """
    Find places within a radius of coordinates.
    GET /api/places/nearby/?lat=53.3498&lng=-6.2603&radius_km=5
    
    Uses PostGIS distance calculation to find nearest places.
    Returns results ordered by distance from the point.
    
    Query Parameters:
    - lat (float): Latitude (required)
    - lng (float): Longitude (required)
    - radius_km (float): Search radius in kilometers (default: 5)
    """
    serializer_class = PlaceDetailSerializer

    def get_queryset(self):
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius_km = self.request.query_params.get("radius_km", 5)

        # Return empty if coordinates not provided
        if not lat or not lng:
            return Place.objects.none()

        try:
            lat = float(lat)
            lng = float(lng)
            radius_km = float(radius_km)
        except ValueError:
            return Place.objects.none()

        # Create point in WGS84 (longitude, latitude)
        user_point = Point(lng, lat, srid=4326)

        # Query places within radius, ordered by distance
        qs = (
            Place.objects
            .annotate(distance=Distance("location", user_point))
            .filter(location__distance_lte=(user_point, D(km=radius_km)))
            .order_by("distance")
            .select_related("category")
        )
        return qs

    def get_serializer_context(self):
        """Pass request to serializer for user context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class RatingListAPIView(generics.ListAPIView):
    """
    List all ratings for a specific place.
    GET /api/places/<place_id>/ratings/
    
    Returns ratings sorted by newest first, with user information.
    """
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        place_id = self.kwargs.get('place_id')
        return Rating.objects.filter(place_id=place_id).select_related('user', 'place').order_by('-created_at')


class RatingCreateAPIView(generics.CreateAPIView):
    """
    Create or update a rating for a place.
    POST /api/places/<place_id>/ratings/create/
    
    If user already rated this place, updates the existing rating.
    Otherwise creates a new rating.
    
    Request body:
    {
        "stars": 5,
        "comment": "Great place!"
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
            # Update existing rating
            serializer = self.get_serializer(existing_rating, data=request.data, partial=True)
        else:
            # Create new rating
            request.data['place'] = place_id
            serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RatingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete a specific rating.
    GET    /api/ratings/<id>/
    PATCH  /api/ratings/<id>/
    DELETE /api/ratings/<id>/
    
    Users can only edit/delete their own ratings.
    """
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]
    queryset = Rating.objects.select_related("user", "place")

    def perform_update(self, serializer):
        """Verify user owns this rating before updating"""
        if serializer.instance.user != self.request.user:
            raise PermissionDenied("You can only edit your own ratings.")
        serializer.save()

    def perform_destroy(self, instance):
        """Verify user owns this rating before deleting"""
        if instance.user != self.request.user:
            raise PermissionDenied("You can only delete your own ratings.")
        instance.delete()


class ItineraryListCreateAPIView(generics.ListCreateAPIView):
    """
    List user's itineraries and create new ones.
    GET  /api/itineraries/
    POST /api/itineraries/
    
    POST Request body:
    {
        "name": "Dublin Weekend Trip",
        "total_cost": 0,
        "total_time_minutes": 0
    }
    """
    serializer_class = ItinerarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only return itineraries for current user"""
        return (
            Itinerary.objects
            .filter(user=self.request.user)
            .prefetch_related("stops__place")
        )

    def perform_create(self, serializer):
        """Automatically assign itinerary to current user"""
        serializer.save(user=self.request.user)


class ItineraryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete a specific itinerary.
    GET    /api/itineraries/<id>/
    PATCH  /api/itineraries/<id>/
    DELETE /api/itineraries/<id>/
    
    Users can only manage their own itineraries.
    """
    serializer_class = ItinerarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only return itineraries for current user"""
        return (
            Itinerary.objects
            .filter(user=self.request.user)
            .prefetch_related("stops__place")
        )


class ItineraryStopListCreateAPIView(generics.ListCreateAPIView):
    """
    List stops in an itinerary and add new stops.
    GET  /api/itineraries/<itinerary_id>/stops/
    POST /api/itineraries/<itinerary_id>/stops/
    
    POST Request body:
    {
        "order": 1,
        "place": 5,
        "arrival_time": "2025-12-15T09:00:00Z",
        "departure_time": "2025-12-15T11:00:00Z"
    }
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Get stops for the specified itinerary owned by current user"""
        itinerary_id = self.kwargs["itinerary_id"]
        return (
            ItineraryStop.objects
            .filter(itinerary__id=itinerary_id, itinerary__user=self.request.user)
            .select_related("place")
        )

    def get_serializer_class(self):
        """Use different serializer for GET (full details) vs POST (minimal input)"""
        if self.request.method == "POST":
            return ItineraryStopWriteSerializer
        return ItineraryStopSerializer

    def perform_create(self, serializer):
        """Attach stop to the specified itinerary"""
        itinerary_id = self.kwargs["itinerary_id"]
        itinerary = get_object_or_404(Itinerary, id=itinerary_id, user=self.request.user)
        serializer.save(itinerary=itinerary)


class ItineraryStopDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete a specific itinerary stop.
    GET    /api/itinerarystops/<id>/
    PATCH  /api/itinerarystops/<id>/
    DELETE /api/itinerarystops/<id>/
    
    Users can only manage stops in their own itineraries.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only return stops from itineraries owned by current user"""
        return (
            ItineraryStop.objects
            .filter(itinerary__user=self.request.user)
            .select_related("place", "itinerary")
        )

    def get_serializer_class(self):
        """Use write serializer for updates, read serializer for retrieval"""
        if self.request.method in ("PATCH", "PUT"):
            return ItineraryStopWriteSerializer
        return ItineraryStopSerializer


class AreaListAPIView(generics.ListAPIView):
    """
    List all Irish geographic areas.
    GET /api/areas/
    
    Returns area names, coordinates, and GeoJSON boundaries for map display.
    """
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = []


