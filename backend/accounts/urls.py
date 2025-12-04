from django.urls import path
from . import views

urlpatterns = [
    # Current user profile
    path("profile/me/", views.MeProfileAPIView.as_view(), name="profile-me"),

    # Favourites
    path("favourites/", views.FavouritePlaceListCreateAPIView.as_view(), name="favourite-list"),
    path("favourites/<int:pk>/", views.FavouritePlaceDetailAPIView.as_view(), name="favourite-detail"),

    # Visited places
    path("visited/", views.VisitedPlaceListCreateAPIView.as_view(), name="visited-list"),
    path("visited/<int:pk>/", views.VisitedPlaceDetailAPIView.as_view(), name="visited-detail"),

    # Photos for visited place
    path(
        "visited/<int:visited_id>/photos/",
        views.PlacePhotoListCreateAPIView.as_view(),
        name="placephoto-list",
    ),
    path(
        "photos/<int:pk>/",
        views.PlacePhotoDetailAPIView.as_view(),
        name="placephoto-detail",
    ),
]
