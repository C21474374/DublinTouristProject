# backend/accounts/views.py

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.models import Token
from rest_framework import serializers

from .models import TouristProfile, FavouritePlace, PlacePhoto
from .serializers import (
    TouristProfileSerializer,
    FavouritePlaceSerializer,
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
    GET  /api/favourites/
    POST /api/favourites/  { "place": 1 }
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
        
        existing = FavouritePlace.objects.filter(user=self.request.user, place=place).first()
        if existing:
            raise serializers.ValidationError({"place": "Already in favorites"})
        
        serializer.save(user=self.request.user, place=place)


# ---------------------------------------------------
# SINGLE FAVORITE: DELETE
# ---------------------------------------------------
class FavouriteDetailAPIView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/favourites/<place_id>/
    DELETE /api/favourites/<place_id>/
    """
    serializer_class = FavouritePlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FavouritePlace.objects.filter(user=self.request.user)

    def get_object(self):
        place_id = self.kwargs.get('pk')
        return get_object_or_404(FavouritePlace, user=self.request.user, place_id=place_id)


# ---------------------------------------------------
# PLACE PHOTOS: LIST + UPLOAD
# ---------------------------------------------------
class PlacePhotoListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/photos/
    GET  /api/photos/?place_id=1
    POST /api/photos/  (multipart form with image + caption)
    """
    serializer_class = PlacePhotoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = PlacePhoto.objects.all().select_related('user', 'place')
        
        # Filter by place_id if provided
        place_id = self.request.query_params.get('place_id')
        if place_id:
            queryset = queryset.filter(place_id=place_id)
        
        return queryset

    def perform_create(self, serializer):
        place_id = self.request.data.get('place')
        
        if not place_id:
            raise serializers.ValidationError({"place": "place_id is required"})
        
        try:
            place = Place.objects.get(id=place_id)
        except Place.DoesNotExist:
            raise serializers.ValidationError({"place": "Place not found"})
        
        serializer.save(user=self.request.user, place=place)


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
        return PlacePhoto.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise serializers.ValidationError("You can only delete your own photos")
        instance.delete()


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
