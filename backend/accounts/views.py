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
    ChangePasswordSerializer,
)
from places.models import Place


class RegisterAPIView(generics.CreateAPIView):
    """
    User registration endpoint.
    Creates User, Token, and TouristProfile.
    Returns token and user data.
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


class LoginAPIView(generics.GenericAPIView):
    """
    User login endpoint.
    Validates credentials and returns token.
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


class LogoutAPIView(generics.GenericAPIView):
    """
    User logout endpoint.
    Deletes the user's authentication token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        request.user.auth_token.delete()
        return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)


class MeProfileAPIView(generics.RetrieveAPIView):
    """
    Get current user's tourist profile.
    Creates profile automatically if it doesn't exist.
    """
    serializer_class = TouristProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, created = TouristProfile.objects.get_or_create(user=self.request.user)
        return profile


class FavouriteListCreateAPIView(generics.ListCreateAPIView):
    """
    List user's favorite places and add new favorites.
    Prevents duplicate favorites for the same place.
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
        
        # Check if already in favorites
        existing = FavouritePlace.objects.filter(user=self.request.user, place=place).first()
        if existing:
            raise serializers.ValidationError({"place": "Already in favorites"})
        
        serializer.save(user=self.request.user, place=place)


class FavouriteDetailAPIView(generics.RetrieveDestroyAPIView):
    """
    View or delete a specific favorite place.
    Only the user who added it can delete it.
    """
    serializer_class = FavouritePlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FavouritePlace.objects.filter(user=self.request.user)

    def get_object(self):
        place_id = self.kwargs.get('pk')
        return get_object_or_404(FavouritePlace, user=self.request.user, place_id=place_id)


class PlacePhotoListCreateAPIView(generics.ListCreateAPIView):
    """
    List place photos and upload new ones.
    Supports filtering by place_id query parameter.
    Requires multipart form data for image upload.
    """
    serializer_class = PlacePhotoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = PlacePhoto.objects.all().select_related('user', 'place')
        
        # Filter by place if place_id parameter provided
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


class PlacePhotoDetailAPIView(generics.RetrieveDestroyAPIView):
    """
    View or delete a specific photo.
    Only the user who uploaded it can delete it.
    """
    serializer_class = PlacePhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PlacePhoto.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise serializers.ValidationError("You can only delete your own photos")
        instance.delete()


class UserDetailAPIView(generics.RetrieveAPIView):
    """
    Get current authenticated user's details.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserUpdateAPIView(generics.UpdateAPIView):
    """
    Update current user's profile information.
    Can update username, email, first_name, last_name.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChangePasswordAPIView(generics.GenericAPIView):
    """
    Change user's password.
    Requires old password verification and new passwords must match.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)
