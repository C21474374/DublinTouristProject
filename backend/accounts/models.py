# accounts/models.py

from django.db import models
from django.contrib.auth.models import User
from places.models import Place

class TouristProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)

    def __str__(self):
        return self.user.username


class FavouritePlace(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favourites")
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'place')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username} → {self.place.name}"


class PlacePhoto(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="place_photos")
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="place_photos/%Y/%m/%d/")
    caption = models.CharField(max_length=500, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Photo by {self.user.username} for {self.place.name}"

