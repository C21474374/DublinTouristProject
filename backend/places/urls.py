from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path("categories/", views.CategoryListAPIView.as_view(), name="category-list"),

    # Places
    path("places/", views.PlaceListAPIView.as_view(), name="places-list"),
    path("places/<int:pk>/", views.PlaceDetailAPIView.as_view(), name="places-detail"),
    path("places/nearby/", views.NearbyPlaceListAPIView.as_view(), name="places-nearby"),

    # Ratings
    path("places/<int:place_id>/ratings/", views.RatingListAPIView.as_view(), name="ratings-list"),
    path("places/<int:place_id>/ratings/create/", views.RatingCreateAPIView.as_view(), name="ratings-create"),
    path("ratings/<int:pk>/", views.RatingDetailAPIView.as_view(), name="ratings-detail"),

    # Itineraries
    path("itineraries/", views.ItineraryListCreateAPIView.as_view(), name="itineraries-list-create"),
    path("itineraries/<int:pk>/", views.ItineraryDetailAPIView.as_view(), name="itineraries-detail"),
    path("itineraries/<int:itinerary_id>/stops/", views.ItineraryStopListCreateAPIView.as_view(), name="itinerary-stops-list-create"),
    path("itinerarystops/<int:pk>/", views.ItineraryStopDetailAPIView.as_view(), name="itinerary-stops-detail"),


]
