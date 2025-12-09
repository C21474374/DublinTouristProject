# accounts/models.py

from django.db import models
from django.contrib.auth.models import User
from places.models import Place


class TouristProfile(models.Model):
    """
    Extended user profile to store tourist-specific data.
    Created automatically when a user registers.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)  # Gamification points

    def __str__(self):
        return self.user.username


class FavouritePlace(models.Model):
    """
    Stores user's favorite places.
    Each user can favorite multiple places, but each place can only be favorited once per user.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favourites")
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'place')  # Prevent duplicate favorites
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username} → {self.place.name}"


class PlacePhoto(models.Model):
    """
    Stores user-uploaded photos for places.
    Users can upload multiple photos for the same place.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="place_photos")
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="place_photos/%Y/%m/%d/")
    caption = models.CharField(max_length=500, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Photo by {self.user.username} for {self.place.name}"

