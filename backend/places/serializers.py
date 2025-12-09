# places/serializers.py

from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Category, Place, Rating, Itinerary, ItineraryStop, Area


class CategorySerializer(serializers.ModelSerializer):
    """Serialize category data with name and icon"""
    class Meta:
        model = Category
        fields = ["id", "name", "icon"]


class PlaceSerializer(GeoFeatureModelSerializer):
    """
    Serialize places with GeoJSON format for map visualization.
    Used for map markers and list views.
    """
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Place
        geo_field = "location"  # Required for GeoJSON output
        fields = [
            "id",
            "name",
            "description",
            "price",
            "time_required",
            "popularity",
            "child_friendly",
            "wheelchair_access",
            "capacity",
            "created_at",
            "category",
        ]


class PlaceListSerializer(GeoFeatureModelSerializer):
    """
    Serialize places for list views with calculated average rating.
    Used in /api/places/ endpoint with filters.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Place
        geo_field = 'location'
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'price', 'time_required', 'popularity', 'child_friendly',
            'wheelchair_access', 'average_rating'
        ]

    def get_average_rating(self, obj):
        """Calculate average rating from all user ratings"""
        ratings = obj.rating_set.all()
        if ratings:
            return sum(r.stars for r in ratings) / len(ratings)
        return 0


class PlaceDetailSerializer(serializers.ModelSerializer):
    """
    Detailed place view including ratings, user's own rating, and category info.
    Used in /api/places/<id>/ endpoint.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    ratings = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = [
            'id',
            'name',
            'description',
            'category',
            'category_name',
            'location',
            'price',
            'time_required',
            'popularity',
            'child_friendly',
            'wheelchair_access',
            'capacity',
            'created_at',
            'average_rating',
            'user_rating',
            'ratings',
        ]

    def get_average_rating(self, obj):
        """Calculate average star rating for the place"""
        ratings = obj.rating_set.all()
        if ratings:
            return sum(r.stars for r in ratings) / len(ratings)
        return 0

    def get_user_rating(self, obj):
        """Return current user's rating if they have rated this place"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            rating = obj.rating_set.filter(user=request.user).first()
            if rating:
                return RatingSerializer(rating).data
        return None

    def get_ratings(self, obj):
        """Return all ratings for this place"""
        ratings = obj.rating_set.all()
        return RatingSerializer(ratings, many=True).data


class RatingSerializer(serializers.ModelSerializer):
    """
    Serialize ratings including username and place information.
    Place field is set automatically from the request context.
    """
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'place', 'user', 'user_username', 'stars', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        """Set user from request context automatically"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ItineraryStopSerializer(serializers.ModelSerializer):
    """
    Serialize itinerary stops with full place details.
    Used for reading stop information with place data.
    """
    place = PlaceSerializer(read_only=True)

    class Meta:
        model = ItineraryStop
        fields = [
            "id",
            "order",
            "arrival_time",
            "departure_time",
            "place"
        ]


class ItineraryStopWriteSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating/updating itinerary stops.
    Accepts place ID instead of full place object.
    """
    class Meta:
        model = ItineraryStop
        fields = ["id", "order", "arrival_time", "departure_time", "place"]


class ItinerarySerializer(serializers.ModelSerializer):
    """
    Serialize itineraries with all associated stops.
    Used in /api/itineraries/ endpoints.
    """
    stops = ItineraryStopSerializer(many=True, read_only=True)

    class Meta:
        model = Itinerary
        fields = [
            "id",
            "name",
            "total_cost",
            "total_time_minutes",
            "created_at",
            "stops",
        ]


class AreaSerializer(serializers.ModelSerializer):
    """
    Serialize Irish area boundaries with GeoJSON data.
    Used in /api/areas/ endpoint.
    """
    class Meta:
        model = Area
        fields = ['id', 'name', 'latitude', 'longitude', 'geojson']



