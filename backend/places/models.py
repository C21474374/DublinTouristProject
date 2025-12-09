# places/models.py

# IMPORTS
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.auth.models import User


class Category(models.Model):
    """
    Represents a category of places (e.g., Museum, Park, Restaurant).
    """
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=100, blank=True)  # CSS class or icon name for frontend

    def __str__(self):
        return self.name


class Place(models.Model):
    """
    Represents a tourist place with location, details, and accessibility info.
    Uses PostGIS PointField for geographic calculations.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='places')

    # Geographic location stored as [longitude, latitude] (WGS84)
    location = gis_models.PointField(geography=True)

    # Pricing and time information
    price = models.DecimalField(max_digits=7, decimal_places=2)
    time_required = models.IntegerField(help_text="Time required in minutes")
    
    # Popularity metric - incremented when users visit
    popularity = models.IntegerField(default=0)

    # Accessibility filters
    child_friendly = models.BooleanField(default=False)
    wheelchair_access = models.BooleanField(default=False)
    capacity = models.IntegerField(default=1)  # Maximum number of people allowed

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Rating(models.Model):
    """
    User ratings and reviews for places.
    Each user can only rate a place once (unique_together constraint).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='rating_set')
    stars = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'place')  # Prevent duplicate ratings
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} rated {self.place.name} {self.stars}★"


class Itinerary(models.Model):
    """
    Represents a user's travel plan containing multiple stops (places).
    Stores aggregated cost and time information.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="itineraries")
    name = models.CharField(max_length=255)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_time_minutes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class ItineraryStop(models.Model):
    """
    Individual stop within an itinerary.
    Links a place to an itinerary with timing and order information.
    """
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name="stops")
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    order = models.IntegerField()  # Sequence number (1, 2, 3, ...)
    arrival_time = models.DateTimeField(null=True, blank=True)
    departure_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.itinerary.name} - {self.place.name} (Stop {self.order})"


class Area(models.Model):
    """
    Represents Irish geographic areas with GeoJSON boundaries.
    Used for displaying regions on the map.
    """
    name = models.CharField(max_length=200, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    geojson = models.JSONField()  # GeoJSON polygon data

    class Meta:
        verbose_name_plural = "Areas"
        ordering = ['name']

    def __str__(self):
        return self.name

