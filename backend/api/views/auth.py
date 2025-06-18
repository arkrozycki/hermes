from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.core.exceptions import ObjectDoesNotExist
from ..serializers import UserRegistrationSerializer
import logging
from rest_framework import serializers

logger = logging.getLogger(__name__)
User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        if User.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response({
            'message': 'Registration successful. Your account is pending approval. You will be notified once approved.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def set_api_key(request):
    user = request.user
    api_key = request.data.get('api_key')
    if api_key:
        user.api_key = api_key
        user.save()
        return Response({'message': 'API key saved successfully.'}, status=status.HTTP_200_OK)
    return Response({'error': 'API key is required.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout endpoint that blacklists the refresh token.
    Requires a valid refresh token in the request body.
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Blacklist the token
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f"User {request.user.username} logged out successfully")
            return Response(
                {'message': 'Successfully logged out'}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error blacklisting token: {str(e)}")
            return Response(
                {'error': 'Invalid refresh token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response(
            {'error': 'Error during logout'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        logger.debug("Validating credentials in serializer")
        logger.debug(f"Received username: {attrs.get('username')}")
        try:
            user = User.objects.get(username=attrs.get('username'))
            logger.debug(f"Found user: {user.username}, is_active: {user.is_active}, is_approved: {user.is_approved}")
            
            if not user.is_approved:
                raise serializers.ValidationError("Your account is pending approval. Please contact the administrator.")
                
            logger.debug(f"Checking password for user: {user.username}")
            data = super().validate(attrs)
            logger.debug("Credentials validated successfully")
            return data
        except User.DoesNotExist:
            logger.debug(f"No user found with username: {attrs.get('username')}")
            raise
        except Exception as e:
            logger.debug(f"Validation failed with error: {str(e)}")
            raise

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        logger.debug("=== Login Attempt ===")
        logger.debug(f"Request data: {request.data}")
        logger.debug(f"Request headers: {request.headers}")
        try:
            username = request.data.get('username')
            user = User.objects.get(username=username)
            logger.debug(f"User found: {user.username}")
            logger.debug(f"User is_active: {user.is_active}")
            logger.debug(f"User has_usable_password: {user.has_usable_password()}")
        except User.DoesNotExist:
            logger.debug(f"No user found with username: {username}")
        
        response = super().post(request, *args, **kwargs)
        logger.debug(f"Login response status: {response.status_code}")
        logger.debug(f"Login response data: {response.data}")
        logger.debug("=== End Login Attempt ===")
        return response 