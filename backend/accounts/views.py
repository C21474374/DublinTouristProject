# backend/accounts/views.py

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.models import Token
from rest_framework import serializers  # ADD THIS LINE

from .models import TouristProfile, FavouritePlace, VisitedPlace, PlacePhoto
from .serializers import (
    TouristProfileSerializer,
    FavouritePlaceSerializer,  # USE THIS
    VisitedPlaceSerializer,
    PlacePhotoSerializer,
    UserRegisterSerializer,
    UserLoginSerializer,
    UserSerializer,
)

from places.models import Place


# ---------------------------------------------------
# REGISTER
# ---------------------------------------------------
class RegisterAPIView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    """
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = Token.objects.get(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------
# LOGIN
# ---------------------------------------------------
class LoginAPIView(generics.GenericAPIView):
    """
    POST /api/auth/login/
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------
# LOGOUT
# ---------------------------------------------------
class LogoutAPIView(generics.GenericAPIView):
    """
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        request.user.auth_token.delete()
        return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)


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
# FAVORITES: LIST + ADD
# ---------------------------------------------------
class FavouriteListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/favorites/
    POST /api/favorites/  { "place": 1 }
    """
    serializer_class = FavouritePlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FavouritePlace.objects.filter(user=self.request.user).select_related('place')

    def perform_create(self, serializer):
        place_id = self.request.data.get('place')
        
        if not place_id:
            raise serializers.ValidationError({"place": "place_id is required"})
        
        try:
            place = Place.objects.get(id=place_id)
        except Place.DoesNotExist:
            raise serializers.ValidationError({"place": "Place not found"})
        
        # Check if already favorited
        existing = FavouritePlace.objects.filter(user=self.request.user, place=place).first()
        if existing:
            raise serializers.ValidationError({"place": "Already in favorites"})
        
        serializer.save(user=self.request.user, place=place)


# ---------------------------------------------------
# SINGLE FAVORITE: DELETE
# ---------------------------------------------------
class FavouriteDetailAPIView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/favorites/<place_id>/
    DELETE /api/favorites/<place_id>/
    """
    serializer_class = FavouritePlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FavouritePlace.objects.filter(user=self.request.user)

    def get_object(self):
        place_id = self.kwargs.get('pk')
        return get_object_or_404(FavouritePlace, user=self.request.user, place_id=place_id)


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


# ---------------------------------------------------
# USER DETAIL
# ---------------------------------------------------
class UserDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/auth/user/
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
