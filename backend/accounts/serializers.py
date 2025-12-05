from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    TouristProfile,
    FavouritePlace,
    VisitedPlace,
    PlacePhoto
)

from places.serializers import PlaceSerializer
from rest_framework.authtoken.models import Token


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


# ----------------------------
# USER REGISTRATION SERIALIZER
# ----------------------------
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create token
        Token.objects.create(user=user)
        
        # Create profile
        TouristProfile.objects.create(user=user)
        
        return user


# ----------------------------
# USER LOGIN SERIALIZER
# ----------------------------
class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        data['user'] = user
        return data


# ----------------------------
# USER SERIALIZER
# ----------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
