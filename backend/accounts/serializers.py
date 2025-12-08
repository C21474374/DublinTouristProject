# backend/accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TouristProfile, FavouritePlace, PlacePhoto
from places.serializers import PlaceSerializer, PlaceDetailSerializer
from rest_framework.authtoken.models import Token


class TouristProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = TouristProfile
        fields = ["user", "points"]


class FavouritePlaceSerializer(serializers.ModelSerializer):
    place = PlaceDetailSerializer(read_only=True)

    class Meta:
        model = FavouritePlace
        fields = ["id", "place", "added_at"]


class PlacePhotoSerializer(serializers.ModelSerializer):
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
        read_only_fields = ['user', 'place_name', 'uploaded_at']  # place is NOT here, so it's writable


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
        
        Token.objects.create(user=user)
        TouristProfile.objects.create(user=user)
        
        return user


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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


