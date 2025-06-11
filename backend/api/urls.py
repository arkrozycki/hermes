from django.urls import path
from .views import MyTokenObtainPairView, set_api_key, example_view
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('set-api-key/', set_api_key, name='set_api_key'),
    path('example/', example_view, name='example_view'),
]
