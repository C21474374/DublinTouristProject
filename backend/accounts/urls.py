from django.urls import path
from .views import (
    RegisterAPIView,
    LoginAPIView,
    LogoutAPIView,
    MeProfileAPIView,
    FavouritePlaceListCreateAPIView,
    FavouritePlaceDetailAPIView,
    VisitedPlaceListCreateAPIView,
    VisitedPlaceDetailAPIView,
    PlacePhotoListCreateAPIView,
    PlacePhotoDetailAPIView,
    UserDetailAPIView,
)

urlpatterns = [
    # Auth
    path("auth/register/", RegisterAPIView.as_view(), name="register"),
    path("auth/login/", LoginAPIView.as_view(), name="login"),
    path("auth/logout/", LogoutAPIView.as_view(), name="logout"),

    # Profile
    path("profile/me/", MeProfileAPIView.as_view(), name="profile-me"),

    # Favourites
    path("favourites/", FavouritePlaceListCreateAPIView.as_view(), name="favourites-list"),
    path("favourites/<int:pk>/", FavouritePlaceDetailAPIView.as_view(), name="favourites-detail"),

    # Visited
    path("visited/", VisitedPlaceListCreateAPIView.as_view(), name="visited-list"),
    path("visited/<int:pk>/", VisitedPlaceDetailAPIView.as_view(), name="visited-detail"),

    # Photos
    path("visited/<int:visited_id>/photos/", PlacePhotoListCreateAPIView.as_view(), name="photos-list"),
    path("photos/<int:pk>/", PlacePhotoDetailAPIView.as_view(), name="photos-detail"),

    # User Detail
    path("auth/user/", UserDetailAPIView.as_view(), name="user-detail"),
]
