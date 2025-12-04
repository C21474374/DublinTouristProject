# places/models.py

# IMPORTS
from django.db import models
from django.contrib.gis.db import models as gis_models

from django.contrib.auth.models import User
from django.db import models



class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=100, blank=True)  # frontend icon reference

    def __str__(self):
        return self.name



class Place(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='places')

     # store coordinates as [longitude, latitude]
    location = gis_models.PointField(geography=True)


    # DETAILS
    price = models.DecimalField(max_digits=7, decimal_places=2)
    time_required = models.IntegerField(help_text="Time required in minutes")
    
    popularity = models.IntegerField(default=0)  # number of visits
    

    # FILTERS
    child_friendly = models.BooleanField(default=False)
    wheelchair_access = models.BooleanField(default=False)
    capacity = models.IntegerField(default=1)  # supports X number of people

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name



class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="ratings")

    stars = models.IntegerField()
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.place.name} - {self.stars} stars"

class Itinerary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="itineraries")
    name = models.CharField(max_length=255)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_time_minutes = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
class ItineraryStop(models.Model):
    itinerary = models.ForeignKey(Itinerary, on_delete=models.CASCADE, related_name="stops")
    place = models.ForeignKey(Place, on_delete=models.CASCADE)

    order = models.IntegerField()  # 1, 2, 3, ...
    arrival_time = models.DateTimeField(null=True, blank=True)
    departure_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.itinerary.name} - {self.place.name} (Stop {self.order})"

