# backend/accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TouristProfile, FavouritePlace, PlacePhoto
from places.serializers import PlaceSerializer, PlaceDetailSerializer
from rest_framework.authtoken.models import Token


class TouristProfileSerializer(serializers.ModelSerializer):
    """Serialize user's tourist profile with points"""
    user = serializers.StringRelatedField()

    class Meta:
        model = TouristProfile
        fields = ["user", "points"]


class FavouritePlaceSerializer(serializers.ModelSerializer):
    """Serialize user's favorite places with full place details"""
    place = PlaceDetailSerializer(read_only=True)

    class Meta:
        model = FavouritePlace
        fields = ["id", "place", "added_at"]


class PlacePhotoSerializer(serializers.ModelSerializer):
    """Serialize place photos with user and place information"""
    user = serializers.StringRelatedField(read_only=True)
    place_name = serializers.CharField(source='place.name', read_only=True)

    class Meta:
        model = PlacePhoto
        fields = [
            "id",
            "user",
            "place",
            "place_name",
            "image",
            "caption",
            "uploaded_at"
        ]
        read_only_fields = ['user', 'place_name', 'uploaded_at']


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Handle user registration with password validation.
    Creates User, Token, and TouristProfile automatically.
    """
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, data):
        """Ensure both passwords match"""
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data

    def create(self, validated_data):
        """Create user and associated profile + token"""
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        Token.objects.create(user=user)
        TouristProfile.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Validate login credentials and return user"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Authenticate user with provided credentials"""
        from django.contrib.auth import authenticate
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serialize basic user information"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ChangePasswordSerializer(serializers.Serializer):
    """Handle password change with old password verification"""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    new_password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        """Ensure new passwords match and meet minimum length"""
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({"new_password": "Passwords must match."})
        if len(data['new_password']) < 8:
            raise serializers.ValidationError({"new_password": "Password must be at least 8 characters."})
        return data

    def validate_old_password(self, value):
        """Verify old password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self):
        """Update user's password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


