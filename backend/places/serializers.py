# places/serializers.py
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import (
    Category,
    Place,
    Rating,
    Itinerary,
    ItineraryStop,
    Area,
)

# ----------------------------
# CATEGORY SERIALIZER
# ----------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "icon"]

# ----------------------------
# PLACE SERIALIZER (GeoJSON for Leaflet)
# ----------------------------
class PlaceSerializer(GeoFeatureModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Place
        geo_field = "location"  # critical for GeoJSON output
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

# ----------------------------
# RATING SERIALIZER
# ----------------------------
class RatingSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'place', 'user', 'user_username', 'stars', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']  # ADD 'place' HERE

    def create(self, validated_data):
        # Automatically set the user from the request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

# ----------------------------
# ITINERARY STOP SERIALIZER
# ----------------------------
class ItineraryStopSerializer(serializers.ModelSerializer):
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

# ----------------------------
# ITINERARY SERIALIZER
# ----------------------------
class ItinerarySerializer(serializers.ModelSerializer):
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

# ----------------------------
# PLACE DETAIL SERIALIZER
# ----------------------------
class PlaceDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    ratings = RatingSerializer(source='rating_set', many=True, read_only=True)

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
        ratings = obj.rating_set.all()
        if ratings:
            return sum(r.stars for r in ratings) / len(ratings)
        return 0

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            rating = obj.rating_set.filter(user=request.user).first()
            if rating:
                return RatingSerializer(rating).data
        return None

# ----------------------------
# PLACE LIST SERIALIZER
# ----------------------------
class PlaceListSerializer(GeoFeatureModelSerializer):
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
        ratings = obj.rating_set.all()
        if ratings:
            return sum(r.stars for r in ratings) / len(ratings)
        return 0

# ----------------------------
# AREA SERIALIZER
# ----------------------------
class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ['id', 'name', 'latitude', 'longitude', 'geojson']



