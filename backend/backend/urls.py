"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView
import logging

logger = logging.getLogger(__name__)

urlpatterns = [
    path('admin-ark/', admin.site.urls),  # Admin with trailing slash
    re_path(r'^admin$', RedirectView.as_view(url='/admin/', permanent=True)),  # Redirect admin without slash to admin with slash
    path('api/', include('api.urls')),  # API with trailing slash for proper URL handling
]

# Debug logging
logger.debug("URL patterns: %s", urlpatterns)
