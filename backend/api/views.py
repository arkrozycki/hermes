from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

# Create your views here.

@api_view(['POST'])
def set_api_key(request):
    user = request.user
    api_key = request.data.get('api_key')

    if api_key:
        user.api_key = api_key
        user.save()
        return Response({'message': 'API key saved successfully.'}, status=status.HTTP_200_OK)
    return Response({'error': 'API key is required.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def example_view(request):
    return Response({"message": "Hello, world!"})

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer
