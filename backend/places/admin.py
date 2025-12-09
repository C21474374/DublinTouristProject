from django.contrib import admin
from django.contrib.gis.admin import GeoModelAdmin
from .models import (
    Category, Place, Rating, Itinerary, ItineraryStop, Area
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon')
    search_fields = ('name',)


@admin.register(Place)
class PlaceAdmin(GeoModelAdmin):
    list_display = ('name', 'category', 'price', 'popularity', 'child_friendly', 'wheelchair_access')
    list_filter = ('category', 'child_friendly', 'wheelchair_access', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'category')
        }),
        ('Location', {
            'fields': ('location',)
        }),
        ('Details', {
            'fields': ('price', 'time_required', 'popularity', 'capacity')
        }),
        ('Accessibility', {
            'fields': ('child_friendly', 'wheelchair_access')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'place', 'stars', 'created_at')
    list_filter = ('stars', 'created_at', 'place__category')
    search_fields = ('user__username', 'place__name', 'comment')
    readonly_fields = ('created_at',)


@admin.register(Itinerary)
class ItineraryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'total_cost', 'total_time_minutes', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at',)


@admin.register(ItineraryStop)
class ItineraryStopAdmin(admin.ModelAdmin):
    list_display = ('itinerary', 'place', 'order', 'arrival_time', 'departure_time')
    list_filter = ('itinerary', 'place__category')
    search_fields = ('itinerary__name', 'place__name')


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude')
    search_fields = ('name',)
    readonly_fields = ('geojson',)
