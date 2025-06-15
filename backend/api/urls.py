from django.urls import path
from .views import MyTokenObtainPairView, set_api_key, example_view, register, translate_text
from rest_framework_simplejwt.views import TokenRefreshView
import logging

logger = logging.getLogger(__name__)

# All endpoints expect POST requests unless specified otherwise
urlpatterns = [
    path('auth/register', register, name='register'),  # POST: email, password
    path('token', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),  # POST: username, password
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),  # POST: refresh
    path('set-api-key', set_api_key, name='set_api_key'),  # POST: api_key
    path('example', example_view, name='example_view'),  # GET
    path('translate', translate_text, name='translate_text'),  # POST: text, target_language, [source_language]
]

# Debug logging
logger.debug("API URL patterns: %s", urlpatterns)
