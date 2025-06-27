# Hermes Backend - Claude AI Assistant Guide

## Project Overview
This is a Django REST API backend for the Hermes translation application. It provides JWT-authenticated API endpoints for user management, translation services via Google Translate API, and translation history tracking.

## Key Technologies
- **Framework**: Django 5.2.3 with Django REST Framework
- **Database**: PostgreSQL (configured for Docker)
- **Authentication**: JWT tokens via rest_framework_simplejwt
- **Translation**: Google Translate API
- **Deployment**: Docker with multi-stage build

## Project Structure
```
backend/
├── backend/                    # Main Django project configuration
│   ├── settings.py            # Django settings with JWT, CORS, PostgreSQL
│   ├── urls.py               # Root URL configuration
│   ├── wsgi.py               # WSGI application
│   └── asgi.py               # ASGI application
├── api/                       # Main application
│   ├── models/               # Data models
│   │   ├── user.py          # CustomUser with api_key and is_approved fields
│   │   ├── translation.py    # Translation cache model
│   │   └── history.py       # UserTranslationHistory model
│   ├── views/               # API views
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── translation.py   # Translation endpoints
│   │   └── misc.py          # Utility endpoints
│   ├── serializers.py       # DRF serializers
│   └── urls.py              # API URL patterns
├── requirements.txt          # Python dependencies
├── Dockerfile               # Multi-stage Docker build
└── manage.py               # Django management script
```

## Key Models

### CustomUser (api/models/user.py)
- Extends AbstractUser
- `api_key`: CharField for Google Translate API key storage
- `is_approved`: BooleanField for user approval system

### Translation (api/models/translation.py)
- Translation cache model
- Fields: source_text, translated_text, source_language, target_language
- Indexed for performance with unique_together constraint
- Tracks usage_count and last_accessed

### UserTranslationHistory (api/models/history.py)
- User translation history tracking
- Links to CustomUser with ForeignKey
- Tracks input/output text, languages, timestamp, cache status

## API Endpoints (api/urls.py)

### Authentication
- `POST /api/auth/register` - User registration (email, password)
- `POST /api/auth/logout` - Logout (refresh_token)
- `POST /api/token` - JWT token obtain (username, password)
- `POST /api/token/refresh` - JWT token refresh (refresh)

### Translation
- `POST /api/translate` - Translate text (text, target_language, [source_language])
- `GET /api/translations/history` - Get user translation history (page, limit)
- `PATCH /api/translations/<id>` - Edit translation
- `DELETE /api/translations/<id>/delete` - Delete translation

### Utility
- `POST /api/set-api-key` - Set Google Translate API key
- `GET /api/example` - Example endpoint

## Configuration Details

### Database (settings.py:95-104)
- PostgreSQL configured for Docker
- Database: 'hermes', User/Password: 'hermes', Host: 'db'

### JWT Settings (settings.py:164-178)
- Access token: 60 minutes
- Refresh token: 5 days
- Token rotation enabled with blacklisting

### Google Translate API
- API key stored in environment variable: `GOOGLE_TRANSLATE_API_KEY`
- User-specific API keys stored in CustomUser.api_key field

### Security Notes
- DEBUG=True (development setting)
- ALLOWED_HOSTS=['*'] (development setting)
- CORS_ALLOW_ALL_ORIGINS=True (development setting)
- Insecure SECRET_KEY in source (development setting)

## Common Tasks

### Database Operations
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Running Development Server
```bash
python manage.py runserver
```

### Testing
```bash
python manage.py test
```

### Static Files
```bash
python manage.py collectstatic
```

### Docker Build
```bash
docker build -t hermes-backend .
```

## Dependencies (requirements.txt)
- Django 5.2.3
- djangorestframework 3.14.0+
- djangorestframework-simplejwt 5.3.1+
- psycopg2-binary (PostgreSQL adapter)
- django-cors-headers 4.7.0
- requests 2.31.0 (for API calls)
- gunicorn (production server)

## Development vs Production
Current configuration is set for development. For production deployment:
- Set DEBUG=False
- Configure proper ALLOWED_HOSTS
- Use secure SECRET_KEY from environment
- Configure CORS properly
- Use environment variables for sensitive settings
- Enable HTTPS and security middleware

## Logging
- Console logging configured for 'api' app
- DEBUG level logging enabled
- URL pattern debugging in urls.py files

## File Organization Patterns
- Models split into separate files in models/ directory
- Views organized by functionality in views/ directory
- URL patterns documented with expected HTTP methods and parameters
- Custom user model extending AbstractUser
- JWT authentication with token blacklisting

## Important Notes for Claude
- User approval system: Users have `is_approved` field that may gate access
- Translation caching: Translations are cached in Translation model
- API key management: Both global and user-specific Google Translate API keys
- History tracking: All user translations are logged in UserTranslationHistory
- CORS enabled for cross-origin requests (frontend integration)
- PostgreSQL database requires Docker setup