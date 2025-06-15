from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Translation, UserTranslationHistory
import logging
import requests
import os
from django.utils import timezone

logger = logging.getLogger(__name__)

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
            # Record history with new model fields
            UserTranslationHistory.objects.create(
                user=request.user,
                source_language=cached_translation.source_language,
                target_language=cached_translation.target_language,
                input_text=cached_translation.source_text,
                output_text=cached_translation.translated_text,
                was_cached=True
            )
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
            translation_obj = Translation.objects.create(
                source_text=text,
                translated_text=translation['translatedText'],
                source_language=detected_source_language,
                target_language=target_language
            )
            # Record history with new model fields
            UserTranslationHistory.objects.create(
                user=request.user,
                source_language=detected_source_language,
                target_language=target_language,
                input_text=text,
                output_text=translation['translatedText'],
                was_cached=False
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