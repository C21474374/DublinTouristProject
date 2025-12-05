from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import (
    Category,
    Place,
    Rating,
    Itinerary,
    ItineraryStop,
    Favorite
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
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'user_username', 'user_first_name', 'place', 'stars', 'comment', 'created_at']
        read_only_fields = ['user', 'place', 'created_at']  # ADD 'place' HERE


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
class PlaceDetailSerializer(GeoFeatureModelSerializer):
    ratings = RatingSerializer(many=True, read_only=True, source='rating_set')
    average_rating = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()

    class Meta:
        model = Place
        geo_field = 'location'
        fields = [
            'id', 'name', 'description', 'category', 'price', 
            'time_required', 'popularity', 'child_friendly', 
            'wheelchair_access', 'capacity', 'ratings', 
            'average_rating', 'user_rating', 'created_at'
        ]

    def get_average_rating(self, obj):
        ratings = obj.rating_set.all()
        if ratings.exists():
            avg = sum(r.stars for r in ratings) / ratings.count()
            return round(avg, 1)
        return 0

    def get_user_rating(self, obj):
        # Get request from context, not self
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            rating = obj.rating_set.filter(user=request.user).first()
            return RatingSerializer(rating).data if rating else None
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
        if ratings.exists():
            avg = sum(r.stars for r in ratings) / ratings.count()
            return round(avg, 1)
        return 0


# ----------------------------
# FAVORITE SERIALIZER
# ----------------------------
class FavoriteSerializer(serializers.ModelSerializer):
    place = PlaceListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'place', 'created_at']
        read_only_fields = ['user', 'created_at']
