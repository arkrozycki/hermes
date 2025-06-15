from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Translation

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_active', 'date_joined')
    search_fields = ('username', 'email')
    list_filter = ('is_active', 'is_staff')

@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ('source_language', 'target_language', 'source_text', 'translated_text', 'usage_count', 'last_accessed')
    search_fields = ('source_text', 'translated_text')
    list_filter = ('source_language', 'target_language')
    readonly_fields = ('created_at', 'last_accessed', 'usage_count')
    ordering = ('-last_accessed',)
