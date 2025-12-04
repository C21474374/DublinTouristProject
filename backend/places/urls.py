from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path("categories/", views.CategoryListAPIView.as_view(), name="category-list"),

    # Places
    path("places/", views.PlaceListAPIView.as_view(), name="place-list"),
    path("places/<int:pk>/", views.PlaceDetailAPIView.as_view(), name="place-detail"),
    path("places/nearby/", views.NearbyPlaceListAPIView.as_view(), name="place-nearby"),

    # Ratings
    path(
        "places/<int:place_id>/ratings/",
        views.PlaceRatingListCreateAPIView.as_view(),
        name="place-ratings",
    ),
    path(
        "ratings/<int:pk>/",
        views.RatingDetailAPIView.as_view(),
        name="rating-detail",
    ),

    # Itineraries
    path(
        "itineraries/",
        views.ItineraryListCreateAPIView.as_view(),
        name="itinerary-list",
    ),
    path(
        "itineraries/<int:pk>/",
        views.ItineraryDetailAPIView.as_view(),
        name="itinerary-detail",
    ),

    # Itinerary stops
    path(
        "itineraries/<int:itinerary_id>/stops/",
        views.ItineraryStopListCreateAPIView.as_view(),
        name="itinerarystop-list",
    ),
    path(
        "itinerarystops/<int:pk>/",
        views.ItineraryStopDetailAPIView.as_view(),
        name="itinerarystop-detail",
    ),
]
