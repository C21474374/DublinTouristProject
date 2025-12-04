from django.contrib import admin
from .models import TouristProfile, FavouritePlace, VisitedPlace, PlacePhoto

admin.site.register(TouristProfile)
admin.site.register(FavouritePlace)
admin.site.register(VisitedPlace)
admin.site.register(PlacePhoto)