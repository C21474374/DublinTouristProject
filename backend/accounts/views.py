from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

def test_view(request):
    return HttpResponse("Accounts app working.")
