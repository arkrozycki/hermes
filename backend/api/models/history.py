from django.db import models
from django.utils import timezone
from .user import CustomUser

class UserTranslationHistory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='translation_history')
    source_language = models.CharField(max_length=10, default='en')  # Default to English
    target_language = models.CharField(max_length=10, default='es')  # Default to Spanish
    input_text = models.TextField(default='')
    output_text = models.TextField(default='')
    timestamp = models.DateTimeField(auto_now_add=True)
    was_cached = models.BooleanField(default=False)  # Whether the translation was from cache
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']  # Most recent first
        
    def __str__(self):
        return f"{self.user.username} - {self.source_language}->{self.target_language} - {self.timestamp}" 