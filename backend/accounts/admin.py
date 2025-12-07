from django.contrib import admin
from .models import TouristProfile, FavouritePlace, PlacePhoto

admin.site.register(TouristProfile)
admin.site.register(FavouritePlace)

admin.site.register(PlacePhoto)