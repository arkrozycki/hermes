from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import UserRegistrationSerializer
from .models import Translation
import logging
import requests
import os
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        # Check if user already exists
        email = serializer.validated_data['email']
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the user
        user = serializer.save()

        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'token': str(refresh.access_token),
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def translate_text(request):
    """
    Translate text using Google Cloud Translate API with caching.
    Required fields in request:
    - text: The text to translate
    - target_language: The target language code (e.g., 'es', 'fr', 'de')
    Optional fields:
    - source_language: The source language code (if known)
    """
    try:
        text = request.data.get('text')
        target_language = request.data.get('target_language')
        source_language = request.data.get('source_language')
        api_key = os.getenv('GOOGLE_TRANSLATE_API_KEY')

        if not text or not target_language:
            return Response(
                {'error': 'Both text and target_language are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not api_key:
            return Response(
                {'error': 'Google Translate API key not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # First try to find in cache with exact source language match
        cached_translation = Translation.objects.filter(
            source_text=text,
            target_language=target_language,
            source_language=source_language
        ).first()

        if not cached_translation:
            # If not found with exact match, try without source language
            cached_translation = Translation.objects.filter(
                source_text=text,
                target_language=target_language
            ).first()

        if cached_translation:
            # Update usage stats
            cached_translation.usage_count += 1
            cached_translation.last_accessed = timezone.now()
            cached_translation.save()
            
            logger.info(f"Cache hit for translation: {text[:50]}...")
            return Response({
                'translated_text': cached_translation.translated_text,
                'source_language': cached_translation.source_language,
                'target_language': cached_translation.target_language,
                'from_cache': True
            })

        # If not in cache, proceed with Google API call
        url = 'https://translation.googleapis.com/language/translate/v2'
        params = {
            'key': api_key,
            'q': text,
            'target': target_language
        }
        if source_language:
            params['source'] = source_language

        response = requests.post(url, params=params)
        response.raise_for_status()
        result = response.json()

        if 'data' not in result or 'translations' not in result['data']:
            raise Exception('Unexpected API response format')

        translation = result['data']['translations'][0]
        detected_source_language = translation.get('detectedSourceLanguage', source_language)

        # Store in cache
        try:
            Translation.objects.create(
                source_text=text,
                translated_text=translation['translatedText'],
                source_language=detected_source_language,
                target_language=target_language
            )
        except Exception as e:
            logger.warning(f"Failed to cache translation: {str(e)}")
            # Continue even if caching fails

        logger.info(f"Cache miss for translation: {text[:50]}...")
        return Response({
            'translated_text': translation['translatedText'],
            'source_language': detected_source_language,
            'target_language': target_language,
            'from_cache': False
        })

    except requests.exceptions.RequestException as e:
        logger.error(f"Translation API error: {str(e)}")
        return Response(
            {'error': 'Translation API request failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return Response(
            {'error': 'Translation failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        logger.debug("Validating credentials in serializer")
        logger.debug(f"Received username: {attrs.get('username')}")
        try:
            user = User.objects.get(username=attrs.get('username'))
            logger.debug(f"Found user: {user.username}, is_active: {user.is_active}")
            logger.debug(f"Checking password for user: {user.username}")
            data = super().validate(attrs)
            logger.debug("Credentials validated successfully")
            return data
        except User.DoesNotExist:
            logger.debug(f"No user found with username: {attrs.get('username')}")
            raise
        except Exception as e:
            logger.debug(f"Validation failed with error: {str(e)}")
            raise

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        logger.debug("=== Login Attempt ===")
        logger.debug(f"Request data: {request.data}")
        logger.debug(f"Request headers: {request.headers}")
        
        try:
            username = request.data.get('username')
            user = User.objects.get(username=username)
            logger.debug(f"User found: {user.username}")
            logger.debug(f"User is_active: {user.is_active}")
            logger.debug(f"User has_usable_password: {user.has_usable_password()}")
        except User.DoesNotExist:
            logger.debug(f"No user found with username: {username}")
        
        response = super().post(request, *args, **kwargs)
        logger.debug(f"Login response status: {response.status_code}")
        logger.debug(f"Login response data: {response.data}")
        logger.debug("=== End Login Attempt ===")
        return response
