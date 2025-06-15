from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

# Create your models here.

class CustomUser(AbstractUser):
    api_key = models.CharField(max_length=255, blank=True, null=True)

class Translation(models.Model):
    source_text = models.TextField()
    translated_text = models.TextField()
    source_language = models.CharField(max_length=10)  # e.g., 'en', 'es'
    target_language = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)
    usage_count = models.IntegerField(default=0)
    
    class Meta:
        indexes = [
            models.Index(fields=['source_text', 'source_language', 'target_language']),
            models.Index(fields=['last_accessed']),
        ]
        unique_together = ['source_text', 'source_language', 'target_language']
        
    def __str__(self):
        return f"{self.source_language} -> {self.target_language}: {self.source_text[:50]}..."
