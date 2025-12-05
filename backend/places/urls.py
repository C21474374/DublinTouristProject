from django.urls import path
from . import views
from .views import (
    CategoryListAPIView,
    PlaceListAPIView,
    PlaceDetailAPIView,
    RatingCreateAPIView,
    RatingListAPIView,
    RatingDetailAPIView,
)

urlpatterns = [
    # Categories
    path("categories/", views.CategoryListAPIView.as_view(), name="category-list"),

    # Places
    path("places/", views.PlaceListAPIView.as_view(), name="places-list"),
    path("places/<int:pk>/", views.PlaceDetailAPIView.as_view(), name="places-detail"),

    # Ratings
    path("places/<int:place_id>/ratings/create/", RatingCreateAPIView.as_view(), name="ratings-create"),
    path("places/<int:place_id>/ratings/", RatingListAPIView.as_view(), name="ratings-list"),
    path("ratings/<int:pk>/", RatingDetailAPIView.as_view(), name="ratings-detail"),
]
