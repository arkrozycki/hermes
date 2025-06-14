from rest_framework import serializers
from django.contrib.auth import get_user_model
import secrets

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email',)

    def create(self, validated_data):
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

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            api_key=api_key,
            # Set an unusable password since we're not using password auth
            password=secrets.token_urlsafe(32)
        )

        return user 