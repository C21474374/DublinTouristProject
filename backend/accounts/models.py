# accounts/models.py

from django.db import models
from django.contrib.auth.models import User

class TouristProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)

    def __str__(self):
        return self.user.username

class FavouritePlace(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    place = models.ForeignKey('places.Place', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'place')

    def __str__(self):
        return f"{self.user.username} → {self.place.name}"

class VisitedPlace(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    place = models.ForeignKey('places.Place', on_delete=models.CASCADE)
    visited_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} visited {self.place.name}"

class PlacePhoto(models.Model):
    visited = models.ForeignKey(
        VisitedPlace,
        on_delete=models.CASCADE,
        related_name="photos"
    )
    image = models.ImageField(upload_to="place_photos/")
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.visited.place.name}"

