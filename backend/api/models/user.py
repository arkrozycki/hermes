from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    api_key = models.CharField(max_length=255, blank=True, null=True) 