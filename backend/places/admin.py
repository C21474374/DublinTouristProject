from django.contrib import admin
from .models import (
    Category, Place, Rating, Itinerary, ItineraryStop
)

admin.site.register(Category)
admin.site.register(Place)
admin.site.register(Rating)
admin.site.register(Itinerary)
admin.site.register(ItineraryStop)
