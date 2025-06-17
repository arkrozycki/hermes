from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.utils import timezone
from .models import CustomUser, Translation, UserTranslationHistory

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_active', 'date_joined', 'last_login', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('is_active', 'is_staff', 'date_joined', 'last_login')
    ordering = ('-date_joined',)
    readonly_fields = ('date_joined', 'last_login')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
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
    
    def truncated_source_text(self, obj):
        return obj.source_text[:50] + '...' if len(obj.source_text) > 50 else obj.source_text
    truncated_source_text.short_description = 'Source Text'
    
    def truncated_translated_text(self, obj):
        return obj.translated_text[:50] + '...' if len(obj.translated_text) > 50 else obj.translated_text
    truncated_translated_text.short_description = 'Translated Text'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()

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
