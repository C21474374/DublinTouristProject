# backend/accounts/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path("auth/register/", views.RegisterAPIView.as_view(), name="register"),
    path("auth/login/", views.LoginAPIView.as_view(), name="login"),
    path("auth/logout/", views.LogoutAPIView.as_view(), name="logout"),
    path("auth/user/", views.UserDetailAPIView.as_view(), name="user-detail"),

    # User profile endpoints
    path("profile/me/", views.MeProfileAPIView.as_view(), name="profile-me"),
    path("users/<int:pk>/", views.UserUpdateAPIView.as_view(), name="user-update"),
    path("change-password/", views.ChangePasswordAPIView.as_view(), name="change-password"),

    # Favorite places endpoints
    path("favourites/", views.FavouriteListCreateAPIView.as_view(), name="favourites-list-create"),
    path("favourites/<int:pk>/", views.FavouriteDetailAPIView.as_view(), name="favourites-detail"),

    # User photo upload endpoints
    path("photos/", views.PlacePhotoListCreateAPIView.as_view(), name="photos-list-create"),
    path("photos/<int:pk>/", views.PlacePhotoDetailAPIView.as_view(), name="photos-detail"),
]