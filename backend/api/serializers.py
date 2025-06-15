from rest_framework import serializers
from django.contrib.auth import get_user_model
import secrets
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('email', 'password')

    def create(self, validated_data):
        logger.debug("=== Registration Process ===")
        # Generate a random username from the email
        email = validated_data['email']
        username = email.split('@')[0]
        
        # Make username unique if necessary
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Generate API key
        api_key = secrets.token_urlsafe(32)

        logger.debug(f"Creating user with username: {username}")
        logger.debug(f"Password provided: {validated_data['password']}")

        # Create user with the provided password
        user = User.objects.create_user(
            username=username,
            email=email,
            api_key=api_key,
            password=validated_data['password']  # Use the provided password
        )

        logger.debug(f"User created successfully: {user.username}")
        logger.debug(f"User has_usable_password: {user.has_usable_password()}")
        logger.debug("=== End Registration Process ===")
        return user 