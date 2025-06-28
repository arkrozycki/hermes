from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.utils import timezone
from django import forms
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import path
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import CustomUser, Translation, UserTranslationHistory
import csv
import io
import logging
from django.db import models

logger = logging.getLogger(__name__)

class CSVUploadForm(forms.Form):
    csv_file = forms.FileField(
        label='CSV File',
        help_text='Upload a CSV file with translations. Header should contain language codes (e.g., en,es,fr)'
    )
    source_language = forms.CharField(
        max_length=10,
        required=False,
        label='Source Language',
        help_text='Source language code (e.g., en). If not specified, first column will be used.'
    )

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_active', 'is_approved', 'date_joined', 'last_login', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('is_active', 'is_approved', 'is_staff', 'date_joined', 'last_login')
    ordering = ('-date_joined',)
    readonly_fields = ('date_joined', 'last_login')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_approved', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ('source_language', 'target_language', 'truncated_source_text', 'truncated_translated_text', 
                   'usage_count', 'last_accessed', 'created_at')
    search_fields = ('source_text', 'translated_text')
    list_filter = ('source_language', 'target_language', 'created_at', 'last_accessed')
    readonly_fields = ('created_at', 'last_accessed', 'usage_count')
    ordering = ('-last_accessed',)
    date_hierarchy = 'created_at'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('upload-csv/', self.admin_site.admin_view(self.upload_csv_view), name='api_translation_upload_csv'),
        ]
        return custom_urls + urls
    
    def changelist_view(self, request, extra_context=None):
        """Override changelist view to add upload button"""
        extra_context = extra_context or {}
        extra_context['upload_csv_url'] = '/admin/api/translation/upload-csv/'
        return super().changelist_view(request, extra_context=extra_context)
    
    def upload_csv_view(self, request):
        """Handle CSV upload in admin interface"""
        if request.method == 'POST':
            form = CSVUploadForm(request.POST, request.FILES)
            if form.is_valid():
                csv_file = form.cleaned_data['csv_file']
                source_language = form.cleaned_data['source_language']
                
                # Process CSV file
                result = self.process_csv_file(csv_file, source_language)
                
                # Show results
                if result['success']:
                    messages.success(
                        request,
                        f"CSV upload completed successfully! "
                        f"Added: {result['added_count']}, "
                        f"Skipped: {result['skipped_count']}, "
                        f"Errors: {len(result['errors'])}"
                    )
                    
                    if result['errors']:
                        for error in result['errors'][:5]:  # Show first 5 errors
                            messages.warning(request, error)
                        if len(result['errors']) > 5:
                            messages.warning(request, f"... and {len(result['errors']) - 5} more errors")
                else:
                    messages.error(request, f"CSV upload failed: {result['error']}")
                
                return HttpResponseRedirect('/admin/api/translation/')
        else:
            form = CSVUploadForm()
        
        context = {
            'title': 'Upload Translations from CSV',
            'form': form,
            'opts': self.model._meta,
            'has_view_permission': self.has_view_permission(request),
        }
        return render(request, 'admin/translation_csv_upload.html', context)
    
    def process_csv_file(self, csv_file, source_language=None):
        """Process CSV file and add translations to database"""
        try:
            # Validate file type
            if not csv_file.name.endswith('.csv'):
                return {'success': False, 'error': 'File must be a CSV file'}
            
            # Read CSV content
            csv_content = csv_file.read().decode('utf-8')
            csv_reader = csv.reader(io.StringIO(csv_content))
            
            # Pre-validation: Scan entire file first
            validation_result = self.validate_csv_structure(csv_reader, source_language)
            if not validation_result['valid']:
                return {'success': False, 'error': validation_result['error']}
            
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
            
            return {
                'success': True,
                'added_count': added_count,
                'skipped_count': skipped_count,
                'errors': errors,
                'source_language': source_language,
                'target_languages': target_languages,
                'total_rows_processed': validation_result['total_rows']
            }
            
        except UnicodeDecodeError:
            return {'success': False, 'error': 'CSV file must be UTF-8 encoded'}
        except Exception as e:
            logger.error(f"CSV upload error: {str(e)}")
            return {'success': False, 'error': f'Failed to process CSV file: {str(e)}'}
    
    def validate_csv_structure(self, csv_reader, source_language=None):
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
                if not self.is_valid_language_code(lang_code):
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
    
    def is_valid_language_code(self, lang_code):
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

    def truncated_source_text(self, obj):
        return obj.source_text[:50] + '...' if len(obj.source_text) > 50 else obj.source_text
    truncated_source_text.short_description = 'Source Text'
    
    def truncated_translated_text(self, obj):
        return obj.translated_text[:50] + '...' if len(obj.translated_text) > 50 else obj.translated_text
    truncated_translated_text.short_description = 'Translated Text'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()

    def get_search_results(self, request, queryset, search_term):
        """Enable exact-match search when the term starts with '='.

        Example:
            =el empleo   → matches rows where translated_text or source_text equals "el empleo" (case-insensitive)

        All other searches fall back to Django's default icontains behaviour
        provided by `search_fields`.
        """
        if search_term.startswith('=') and len(search_term) > 1:
            exact_term = search_term[1:].strip()
            queryset = queryset.filter(
                models.Q(source_text__iexact=exact_term) |
                models.Q(translated_text__iexact=exact_term)
            )
            # `False` because we didn't alter joins that could cause duplicates
            return queryset, False

        # Fallback to default behaviour (icontains search on both fields)
        return super().get_search_results(request, queryset, search_term)

@admin.register(UserTranslationHistory)
class UserTranslationHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'source_language', 'target_language', 'truncated_input', 
                   'truncated_output', 'timestamp', 'was_cached', 'time_ago')
    list_filter = ('was_cached', 'timestamp', 'source_language', 'target_language')
    search_fields = ('user__username', 'input_text', 'output_text')
    readonly_fields = ('timestamp', 'was_cached')
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'
    
    def truncated_input(self, obj):
        return obj.input_text[:50] + '...' if len(obj.input_text) > 50 else obj.input_text
    truncated_input.short_description = 'Input Text'
    
    def truncated_output(self, obj):
        return obj.output_text[:50] + '...' if len(obj.output_text) > 50 else obj.output_text
    truncated_output.short_description = 'Output Text'
    
    def time_ago(self, obj):
        delta = timezone.now() - obj.timestamp
        if delta.days > 0:
            return f"{delta.days} days ago"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600} hours ago"
        elif delta.seconds > 60:
            return f"{delta.seconds // 60} minutes ago"
        else:
            return "just now"
    time_ago.short_description = 'Time Ago'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
