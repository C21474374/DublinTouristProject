from django.contrib import admin
from .models import TouristProfile, FavouritePlace, PlacePhoto


@admin.register(TouristProfile)
class TouristProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'points')
    list_filter = ('points',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('user',)


@admin.register(FavouritePlace)
class FavouritePlaceAdmin(admin.ModelAdmin):
    list_display = ('user', 'place', 'added_at')
    list_filter = ('added_at', 'place__category')
    search_fields = ('user__username', 'place__name')
    readonly_fields = ('added_at',)


@admin.register(PlacePhoto)
class PlacePhotoAdmin(admin.ModelAdmin):
    list_display = ('user', 'place', 'uploaded_at')
    list_filter = ('uploaded_at', 'place__category')
    search_fields = ('user__username', 'place__name', 'caption')
    readonly_fields = ('uploaded_at', 'image')
    fieldsets = (
        ('Photo Info', {
            'fields': ('user', 'place', 'image', 'caption')
        }),
        ('Timestamps', {
            'fields': ('uploaded_at',),
            'classes': ('collapse',)
        }),
    )