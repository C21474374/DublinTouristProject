from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import TouristProfile, FavouritePlace, VisitedPlace, PlacePhoto
from .serializers import (
    TouristProfileSerializer,
    FavouritePlaceSerializer,
    VisitedPlaceSerializer,
    PlacePhotoSerializer,
)

from places.models import Place


# ---------------------------------------------------
# CURRENT USER PROFILE
# ---------------------------------------------------
class MeProfileAPIView(generics.RetrieveAPIView):
    """
    GET /api/profile/me/
    """
    serializer_class = TouristProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = TouristProfile.objects.get_or_create(user=self.request.user)
        return profile


# ---------------------------------------------------
# FAVOURITES: LIST + ADD
# ---------------------------------------------------
class FavouritePlaceListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/favourites/
    POST /api/favourites/  { "place_id": 1 }
    """
    serializer_class = FavouritePlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FavouritePlace.objects.filter(user=self.request.user).select_related("place")

    def create(self, request, *args, **kwargs):
        place_id = request.data.get("place_id")
        if not place_id:
            return Response(
                {"detail": "place_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        place = get_object_or_404(Place, id=place_id)
        favourite, created = FavouritePlace.objects.get_or_create(
            user=request.user,
            place=place,
        )
        serializer = self.get_serializer(favourite)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


# ---------------------------------------------------
# SINGLE FAVOURITE: DELETE
# ---------------------------------------------------
class FavouritePlaceDetailAPIView(generics.DestroyAPIView):
    """
    DELETE /api/favourites/<id>/
    """
    serializer_class = FavouritePlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # User can only delete their own favourites
        return FavouritePlace.objects.filter(user=self.request.user)
        

# ---------------------------------------------------
# VISITED PLACES: LIST + ADD
# ---------------------------------------------------
class VisitedPlaceListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/visited/
    POST /api/visited/  { "place_id": 1 }
    """
    serializer_class = VisitedPlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VisitedPlace.objects.filter(user=self.request.user).select_related("place")

    def create(self, request, *args, **kwargs):
        place_id = request.data.get("place_id")
        if not place_id:
            return Response(
                {"detail": "place_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        place = get_object_or_404(Place, id=place_id)
        visited, created = VisitedPlace.objects.get_or_create(
            user=request.user,
            place=place,
        )
        serializer = self.get_serializer(visited)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


# ---------------------------------------------------
# SINGLE VISITED: DELETE
# ---------------------------------------------------
class VisitedPlaceDetailAPIView(generics.DestroyAPIView):
    """
    DELETE /api/visited/<id>/
    """
    serializer_class = VisitedPlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VisitedPlace.objects.filter(user=self.request.user)


# ---------------------------------------------------
# PHOTOS FOR A VISITED PLACE: LIST + UPLOAD
# ---------------------------------------------------
class PlacePhotoListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/visited/<visited_id>/photos/
    POST /api/visited/<visited_id>/photos/
      form-data:
        image: <file>
        caption: "Nice view"
    """
    serializer_class = PlacePhotoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        visited_id = self.kwargs["visited_id"]
        return PlacePhoto.objects.filter(
            visited__id=visited_id,
            visited__user=self.request.user
        )

    def perform_create(self, serializer):
        visited_id = self.kwargs["visited_id"]
        visited = get_object_or_404(
            VisitedPlace,
            id=visited_id,
            user=self.request.user
        )
        serializer.save(visited=visited)


# ---------------------------------------------------
# SINGLE PHOTO: RETRIEVE / DELETE
# ---------------------------------------------------
class PlacePhotoDetailAPIView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/photos/<id>/
    DELETE /api/photos/<id>/
    """
    serializer_class = PlacePhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PlacePhoto.objects.filter(visited__user=self.request.user)
