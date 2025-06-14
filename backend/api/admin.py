from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'api_key')
    fieldsets = UserAdmin.fieldsets + (
        ('API Settings', {'fields': ('api_key',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('API Settings', {'fields': ('api_key',)}),
    )

# Register the CustomUser model with the custom admin class
admin.site.register(CustomUser, CustomUserAdmin)
