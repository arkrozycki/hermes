from django.urls import path
from .views import MyTokenObtainPairView, set_api_key, example_view, register, logout
from .views.translation import translate_text, get_translation_history, edit_translation, delete_translation
from rest_framework_simplejwt.views import TokenRefreshView
import logging

logger = logging.getLogger(__name__)

# All endpoints expect POST requests unless specified otherwise
urlpatterns = [
    path('auth/register', register, name='register'),  # POST: email, password
    path('auth/logout', logout, name='logout'),  # POST: refresh_token
    path('token', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),  # POST: username, password
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),  # POST: refresh
    path('set-api-key', set_api_key, name='set_api_key'),  # POST: api_key
    path('example', example_view, name='example_view'),  # GET
    path('translate', translate_text, name='translate_text'),  # POST: text, target_language, [source_language]
    path('translations/history', get_translation_history, name='translation_history'),  # GET: page, limit
    path('translations/<int:translation_id>', edit_translation, name='edit_translation'),  # PATCH: output_text, source_language, target_language
    path('translations/<int:translation_id>/delete', delete_translation, name='delete_translation'),  # DELETE: [delete_from_cache]
]

# Debug logging
logger.debug("API URL patterns: %s", urlpatterns)
