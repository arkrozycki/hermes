from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from ..models import Translation, UserTranslationHistory
import logging
import requests
import os
from django.utils import timezone
import json
import random

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
    - save_to_db: Boolean flag to save translation to database (default: True)
    """
    try:
        text = request.data.get('text')
        target_language = request.data.get('target_language')
        source_language = request.data.get('source_language')
        save_to_db = request.data.get('save_to_db', True)
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

        # Retrieve all cached translations (synonyms) for the given text / language
        cached_qs = Translation.objects.filter(
            source_text=text,
            target_language=target_language
        )

        # If a specific source_language is provided, prioritise those rows
        if source_language:
            cached_qs = cached_qs.filter(source_language=source_language)

        if cached_qs.exists():
            # Pick one primary translation (highest usage_count, then alphabetic)
            primary_translation = cached_qs.order_by('-usage_count', 'translated_text').first()

            # Update usage stats for the primary translation only (to avoid inflating all rows)
            if save_to_db:
                primary_translation.usage_count += 1
                primary_translation.last_accessed = timezone.now()
                primary_translation.save()

                # Record history entry
                UserTranslationHistory.objects.create(
                    user=request.user,
                    source_language=primary_translation.source_language,
                    target_language=primary_translation.target_language,
                    input_text=primary_translation.source_text,
                    output_text=primary_translation.translated_text,
                    was_cached=True
                )

            all_translations = list(cached_qs.values_list('translated_text', flat=True))

            logger.info(f"Cache hit for translation: {text[:50]}...")
            return Response({
                'translated_text': primary_translation.translated_text,
                'translated_texts': all_translations,
                'source_language': primary_translation.source_language,
                'target_language': primary_translation.target_language,
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

        # Store in cache only if we're saving to db
        if save_to_db:
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

        # After creating the new translation, re-query all synonyms so the response is consistent
        all_translations = list(
            Translation.objects.filter(
                source_text=text,
                target_language=target_language
            ).values_list('translated_text', flat=True)
        )

        logger.info(f"Cache miss for translation: {text[:50]}...")
        return Response({
            'translated_text': translation['translatedText'],
            'translated_texts': all_translations,
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_translation_history(request):
    """
    Get user's translation history with pagination.
    Query parameters:
    - page: Page number (default: 1)
    - limit: Number of items per page (default: 10)
    """
    try:
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 10))
        
        if page < 1 or limit < 1:
            return Response(
                {'error': 'Page and limit must be positive integers'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get translations for the current user
        translations = UserTranslationHistory.objects.filter(
            user=request.user
        ).order_by('-timestamp')[offset:offset + limit]
        
        # Get total count for pagination info
        total_count = UserTranslationHistory.objects.filter(user=request.user).count()
        
        # Prepare response data
        history_data = [{
            'id': t.id,
            'source_language': t.source_language,
            'target_language': t.target_language,
            'input_text': t.input_text,
            'output_text': t.output_text,
            'timestamp': t.timestamp,
            'was_cached': t.was_cached
        } for t in translations]
        
        return Response({
            'translations': history_data,
            'pagination': {
                'current_page': page,
                'total_pages': (total_count + limit - 1) // limit,
                'total_items': total_count,
                'items_per_page': limit
            }
        })
        
    except ValueError:
        return Response(
            {'error': 'Invalid page or limit parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error fetching translation history: {str(e)}")
        return Response(
            {'error': 'Failed to fetch translation history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH', 'OPTIONS'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def edit_translation(request, translation_id):
    """
    Edit a specific translation in the user's history and update the translation cache.
    URL parameter:
    - translation_id: ID of the translation to edit
    
    Request body (all fields optional):
    - output_text: The corrected translation text
    - source_language: The source language code
    - target_language: The target language code
    """
    try:
        logger.debug(f"Attempting to edit translation {translation_id} for user {request.user.id}")
        logger.debug(f"Request content type: {request.content_type}")
        
        # Handle OPTIONS request for CORS
        if request.method == 'OPTIONS':
            return Response(status=status.HTTP_200_OK)
        
        # Get request data
        if request.content_type == 'text/plain;charset=UTF-8':
            try:
                data = json.loads(request.body.decode('utf-8'))
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Invalid JSON in request body'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            data = request.data
            
        logger.debug(f"Request data: {data}")
        
        # Get the translation and verify ownership
        history_entry = UserTranslationHistory.objects.filter(
            id=translation_id,
            user=request.user
        ).first()
        
        if not history_entry:
            logger.warning(f"Translation {translation_id} not found or user {request.user.id} doesn't have permission")
            return Response(
                {'error': 'Translation not found or you do not have permission to edit it'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        logger.debug(f"Found history entry: {history_entry.id}")
        
        # Find the corresponding cache entry
        cache_entry = Translation.objects.filter(
            source_text=history_entry.input_text,
            target_language=history_entry.target_language,
            source_language=history_entry.source_language
        ).first()
        
        logger.debug(f"Cache entry found: {bool(cache_entry)}")
        
        # Update history entry
        if 'output_text' in data:
            history_entry.output_text = data['output_text']
        if 'source_language' in data:
            history_entry.source_language = data['source_language']
        if 'target_language' in data:
            history_entry.target_language = data['target_language']
        
        try:
            history_entry.save()
            logger.debug("Successfully saved history entry")
        except Exception as save_error:
            logger.error(f"Error saving history entry: {str(save_error)}")
            raise
        
        # Update cache entry if it exists
        if cache_entry:
            if 'output_text' in data:
                cache_entry.translated_text = data['output_text']
            if 'source_language' in data:
                cache_entry.source_language = data['source_language']
            if 'target_language' in data:
                cache_entry.target_language = data['target_language']
            
            try:
                cache_entry.save()
                logger.info(f"Updated translation cache for text: {history_entry.input_text[:50]}...")
            except Exception as cache_error:
                logger.error(f"Error saving cache entry: {str(cache_error)}")
                raise
        
        return Response({
            'id': history_entry.id,
            'source_language': history_entry.source_language,
            'target_language': history_entry.target_language,
            'input_text': history_entry.input_text,
            'output_text': history_entry.output_text,
            'timestamp': history_entry.timestamp,
            'was_cached': history_entry.was_cached,
            'cache_updated': bool(cache_entry)
        })
        
    except Exception as e:
        logger.error(f"Error editing translation: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to edit translation', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_translation(request, translation_id):
    """
    Delete a specific translation from the user's history and optionally from the cache.
    URL parameter:
    - translation_id: ID of the translation to delete
    
    Query parameters:
    - delete_from_cache: Boolean (default: False) - Whether to also delete from the translation cache
    """
    try:
        logger.debug(f"Attempting to delete translation {translation_id} for user {request.user.id}")
        
        # Get the translation and verify ownership
        history_entry = UserTranslationHistory.objects.filter(
            id=translation_id,
            user=request.user
        ).first()
        
        if not history_entry:
            logger.warning(f"Translation {translation_id} not found or user {request.user.id} doesn't have permission")
            return Response(
                {'error': 'Translation not found or you do not have permission to delete it'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if we should delete from cache
        delete_from_cache = request.query_params.get('delete_from_cache', 'false').lower() == 'true'
        
        if delete_from_cache:
            # Find and delete the corresponding cache entry
            cache_entry = Translation.objects.filter(
                source_text=history_entry.input_text,
                target_language=history_entry.target_language,
                source_language=history_entry.source_language
            ).first()
            
            if cache_entry:
                cache_entry.delete()
                logger.info(f"Deleted translation from cache: {history_entry.input_text[:50]}...")
        
        # Delete the history entry
        history_entry.delete()
        logger.info(f"Deleted translation history entry {translation_id}")
        
        return Response({
            'message': 'Translation deleted successfully',
            'deleted_from_cache': delete_from_cache
        })
        
    except Exception as e:
        logger.error(f"Error deleting translation: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to delete translation', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_flashcards(request):
    """
    Get randomized translations for flashcard practice.
    Required fields in request:
    - source_lang: The source language code (e.g., 'en', 'es')
    - target_lang: The target language code (e.g., 'es', 'fr', 'de')
    - limit: Number of flashcards to return (max 100)
    """
    try:
        source_lang = request.data.get('source_lang')
        target_lang = request.data.get('target_lang')
        limit = request.data.get('limit', 10)

        if not source_lang or not target_lang:
            return Response(
                {'error': 'Both source_lang and target_lang are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate limit
        try:
            limit = int(limit)
            if limit < 1:
                raise ValueError("Limit must be positive")
            if limit > 100:
                limit = 100  # Cap at 100 for performance
        except (ValueError, TypeError):
            return Response(
                {'error': 'Limit must be a positive integer (max 100)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all translations from database that match the language pair
        # First get from Translation model (cached translations)
        all_translations = list(Translation.objects.filter(
            source_language=source_lang,
            target_language=target_lang
        ))

        # Get all from user history as well
        all_history = list(UserTranslationHistory.objects.filter(
            source_language=source_lang,
            target_language=target_lang
        ))

        # Combine both sources and remove duplicates
        translation_pairs = {}  # Use dict to automatically handle duplicates by key
        
        # Add cached translations
        for translation in all_translations:
            key = (translation.source_text, translation.translated_text)
            if key not in translation_pairs:
                translation_pairs[key] = {
                    'id': translation.id,
                    'source_text': translation.source_text,
                    'translated_text': translation.translated_text,
                    'source_language': translation.source_language,
                    'target_language': translation.target_language,
                    'source': 'cache'
                }
        
        # Add history translations (only if not already present)
        for history in all_history:
            key = (history.input_text, history.output_text)
            if key not in translation_pairs:
                translation_pairs[key] = {
                    'id': f"history_{history.id}",
                    'source_text': history.input_text,
                    'translated_text': history.output_text,
                    'source_language': history.source_language,
                    'target_language': history.target_language,
                    'source': 'history'
                }

        # Convert to list and randomize
        all_unique_translations = list(translation_pairs.values())
        random.shuffle(all_unique_translations)
        
        # Take only the requested limit
        translations = all_unique_translations[:limit]

        # Prepare response data
        flashcards = []
        for translation in translations:
            flashcard = {
                'id': translation['id'],
                'source_text': translation['source_text'],
                'translated_text': translation['translated_text'],
                'source_language': translation['source_language'],
                'target_language': translation['target_language']
            }
            flashcards.append(flashcard)

        return Response({
            'flashcards': flashcards,
            'count': len(flashcards),
            'source_language': source_lang,
            'target_language': target_lang,
            'requested_limit': limit
        })

    except Exception as e:
        logger.error(f"Flashcards error: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve flashcards', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_translations_csv(request):
    """
    Upload translations from a CSV file.
    Expected CSV format:
    - Header row contains language codes (e.g., 'en', 'es', 'fr')
    - Each subsequent row contains translations for the same concept
    - First column is typically the source language
    
    Request should include:
    - file: CSV file with translations
    - source_language: The source language code (defaults to first column)
    
    Returns:
    - added_count: Number of new translations added
    - skipped_count: Number of duplicates skipped
    - errors: List of any errors encountered
    """
    try:
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No CSV file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        csv_file = request.FILES['file']
        source_language = request.data.get('source_language')
        
        # Validate file type
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'File must be a CSV file'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        import csv
        import io
        
        # Read CSV content for pre-validation
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Pre-validation: Scan entire file first
        validation_result = validate_csv_structure(csv_reader, source_language)
        if not validation_result['valid']:
            return Response(
                {'error': validation_result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset file pointer for processing
        csv_file.seek(0)
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Skip header (already validated)
        header = next(csv_reader)
        
        # Use validated source language
        source_language = validation_result['source_language']
        target_languages = validation_result['target_languages']
        
        added_count = 0
        skipped_count = 0
        errors = []
        
        # Process each row (skip header)
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Get source text
                source_index = header.index(source_language)
                source_text = row[source_index].strip()
                
                if not source_text:
                    errors.append(f"Row {row_num}: Empty source text")
                    continue
                
                # Process each target language
                for target_lang in target_languages:
                    target_index = header.index(target_lang)
                    target_text = row[target_index].strip()
                    
                    if not target_text:
                        errors.append(f"Row {row_num}: Empty translation for {target_lang}")
                        continue
                    
                    # Check if translation already exists
                    existing_translation = Translation.objects.filter(
                        source_text=source_text,
                        source_language=source_language,
                        target_language=target_lang,
                        translated_text=target_text
                    ).first()
                    
                    if existing_translation:
                        skipped_count += 1
                        logger.info(f"Skipped duplicate: {source_language}->{target_lang}: {source_text[:50]}...")
                    else:
                        # Create new translation
                        Translation.objects.create(
                            source_text=source_text,
                            translated_text=target_text,
                            source_language=source_language,
                            target_language=target_lang
                        )
                        added_count += 1
                        logger.info(f"Added translation: {source_language}->{target_lang}: {source_text[:50]}...")
                        
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                logger.error(f"Error processing row {row_num}: {str(e)}")
        
        # Log summary
        logger.info(f"CSV upload completed: {added_count} added, {skipped_count} skipped, {len(errors)} errors")
        
        return Response({
            'message': 'CSV upload completed',
            'added_count': added_count,
            'skipped_count': skipped_count,
            'total_processed': added_count + skipped_count,
            'errors': errors,
            'source_language': source_language,
            'target_languages': target_languages,
            'total_rows_processed': validation_result['total_rows']
        })
        
    except UnicodeDecodeError:
        return Response(
            {'error': 'CSV file must be UTF-8 encoded'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"CSV upload error: {str(e)}")
        return Response(
            {'error': 'Failed to process CSV file', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def validate_csv_structure(csv_reader, source_language=None):
    """
    Pre-validate the entire CSV file structure before processing.
    Returns validation result with file statistics.
    """
    try:
        # Read header row
        try:
            header = next(csv_reader)
        except StopIteration:
            return {'valid': False, 'error': 'CSV file is empty'}
        
        # Validate header structure
        if len(header) < 2:
            return {'valid': False, 'error': 'CSV must have at least 2 columns (source and target languages)'}
        
        # Clean header (remove whitespace)
        header = [col.strip() for col in header]
        
        # Check for empty header cells
        if any(not col for col in header):
            return {'valid': False, 'error': 'CSV header contains empty column names'}
        
        # Check for duplicate language codes in header
        if len(header) != len(set(header)):
            duplicates = [x for x in set(header) if header.count(x) > 1]
            return {'valid': False, 'error': f'Duplicate language codes found in header: {", ".join(duplicates)}'}
        
        # Validate language codes (basic format check)
        for lang_code in header:
            if not is_valid_language_code(lang_code):
                return {'valid': False, 'error': f'Invalid language code format: "{lang_code}". Use 2-3 letter codes (e.g., en, es, fr)'}
        
        # Determine source language
        if not source_language:
            source_language = header[0]
        
        # Validate source language is in header
        if source_language not in header:
            return {'valid': False, 'error': f'Source language "{source_language}" not found in CSV header. Available languages: {", ".join(header)}'}
        
        # Get target languages
        target_languages = [lang for lang in header if lang != source_language]
        
        if not target_languages:
            return {'valid': False, 'error': 'No target languages found in CSV'}
        
        # Scan all data rows for validation
        total_rows = 0
        empty_source_count = 0
        empty_target_count = 0
        malformed_rows = 0
        max_source_length = 0
        max_target_length = 0
        
        source_index = header.index(source_language)
        
        for row_num, row in enumerate(csv_reader, start=2):
            total_rows += 1
            
            # Check row length
            if len(row) != len(header):
                malformed_rows += 1
                continue
            
            # Check source text
            if source_index < len(row):
                source_text = row[source_index].strip()
                if not source_text:
                    empty_source_count += 1
                else:
                    max_source_length = max(max_source_length, len(source_text))
            
            # Check target texts
            for target_lang in target_languages:
                target_index = header.index(target_lang)
                if target_index < len(row):
                    target_text = row[target_index].strip()
                    if not target_text:
                        empty_target_count += 1
                    else:
                        max_target_length = max(max_target_length, len(target_text))
        
        # Generate validation summary
        validation_summary = {
            'total_rows': total_rows,
            'empty_source_count': empty_source_count,
            'empty_target_count': empty_target_count,
            'malformed_rows': malformed_rows,
            'max_source_length': max_source_length,
            'max_target_length': max_target_length
        }
        
        # Check for critical issues
        if total_rows == 0:
            return {'valid': False, 'error': 'CSV file contains no data rows'}
        
        if malformed_rows > total_rows * 0.5:  # More than 50% malformed
            return {'valid': False, 'error': f'Too many malformed rows: {malformed_rows} out of {total_rows} rows have incorrect column count'}
        
        if empty_source_count > total_rows * 0.8:  # More than 80% empty source
            return {'valid': False, 'error': f'Too many empty source texts: {empty_source_count} out of {total_rows} rows have empty source text'}
        
        # Log validation summary
        logger.info(f"CSV validation completed: {total_rows} rows, {malformed_rows} malformed, "
                   f"{empty_source_count} empty source, {empty_target_count} empty targets")
        
        return {
            'valid': True,
            'source_language': source_language,
            'target_languages': target_languages,
            'total_rows': total_rows,
            'validation_summary': validation_summary
        }
        
    except Exception as e:
        logger.error(f"CSV validation error: {str(e)}")
        return {'valid': False, 'error': f'Validation failed: {str(e)}'}

def is_valid_language_code(lang_code):
    """
    Validate language code format.
    Accepts 2-3 letter language codes.
    """
    if not lang_code or not isinstance(lang_code, str):
        return False
    
    # Remove any whitespace
    lang_code = lang_code.strip()
    
    # Check length (2-3 characters)
    if len(lang_code) < 2 or len(lang_code) > 3:
        return False
    
    # Check if it's alphabetic
    if not lang_code.isalpha():
        return False
    
    # Convert to lowercase for consistency
    lang_code = lang_code.lower()
    
    # Common language codes validation (basic check)
    common_codes = {
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'bn', 'ur', 'th', 'vi',
        'nl', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sr', 'sl', 'et', 'lv',
        'lt', 'mt', 'ga', 'cy', 'eu', 'ca', 'gl', 'is', 'fo', 'sq', 'mk', 'bs', 'me', 'ky', 'kk', 'uz',
        'tk', 'mn', 'ka', 'hy', 'az', 'be', 'uk', 'mo', 'el', 'he', 'yi', 'fa', 'ps', 'ku', 'sd', 'ne',
        'si', 'my', 'km', 'lo', 'bo', 'dz', 'ta', 'te', 'kn', 'ml', 'gu', 'pa', 'or', 'as', 'mr', 'sa',
        'dv', 'am', 'ti', 'so', 'sw', 'rw', 'ak', 'lg', 'ln', 'wo', 'ff', 'sn', 'zu', 'xh', 'st', 'ts',
        'tn', 've', 'ss', 'nr', 'ny', 'mg', 'ig', 'yo', 'ha', 'sg', 'rw', 'co', 'sc', 'rm', 'wa', 'oc',
        'an', 'fur', 'lij', 'lmo', 'nap', 'pms', 'vec', 'scn', 'srd', 'fur', 'lij', 'lmo', 'nap', 'pms',
        'vec', 'scn', 'srd', 'fur', 'lij', 'lmo', 'nap', 'pms', 'vec', 'scn', 'srd'
    }
    
    return lang_code in common_codes or (len(lang_code) == 2 and lang_code.isalpha()) 