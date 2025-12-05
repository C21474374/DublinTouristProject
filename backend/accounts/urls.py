# backend/accounts/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterAPIView.as_view(), name="register"),
    path("auth/login/", views.LoginAPIView.as_view(), name="login"),
    path("auth/logout/", views.LogoutAPIView.as_view(), name="logout"),
    path("auth/user/", views.UserDetailAPIView.as_view(), name="user-detail"),

    # Profile
    path("profile/me/", views.MeProfileAPIView.as_view(), name="profile-me"),

    # Favorites
    path("favourites/", views.FavouriteListCreateAPIView.as_view(), name="favourites-list-create"),
    path("favourites/<int:pk>/", views.FavouriteDetailAPIView.as_view(), name="favourites-detail"),

    # Visited Places
    path("visited/", views.VisitedPlaceListCreateAPIView.as_view(), name="visited-list-create"),
    path("visited/<int:pk>/", views.VisitedPlaceDetailAPIView.as_view(), name="visited-detail"),

    # Photos
    path("visited/<int:visited_id>/photos/", views.PlacePhotoListCreateAPIView.as_view(), name="photos-list-create"),
    path("photos/<int:pk>/", views.PlacePhotoDetailAPIView.as_view(), name="photos-detail"),
]
