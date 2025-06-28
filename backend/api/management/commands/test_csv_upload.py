from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import csv
import io

class Command(BaseCommand):
    help = 'Test CSV upload functionality'

    def handle(self, *args, **options):
        self.stdout.write("Testing CSV upload functionality...")
        
        # Create a test CSV in memory
        test_csv_content = """en,es,fr,de
hello,hola,bonjour,hallo
goodbye,adiós,au revoir,auf wiedersehen
thank you,gracias,merci,danke"""
        
        # Test the validation function
        from api.views.translation import validate_csv_structure
        
        csv_reader = csv.reader(io.StringIO(test_csv_content))
        result = validate_csv_structure(csv_reader, source_language='en')
        
        if result['valid']:
            self.stdout.write(self.style.SUCCESS("✅ CSV validation passed!"))
            self.stdout.write(f"Source language: {result['source_language']}")
            self.stdout.write(f"Target languages: {result['target_languages']}")
            self.stdout.write(f"Total rows: {result['total_rows']}")
        else:
            self.stdout.write(self.style.ERROR(f"❌ CSV validation failed: {result['error']}"))
        
        # Test admin URL resolution
        try:
            from django.urls import reverse
            upload_url = reverse('admin:api_translation_upload_csv')
            self.stdout.write(self.style.SUCCESS(f"✅ Admin upload URL resolved: {upload_url}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Admin URL resolution failed: {str(e)}"))
        
        # Test direct URL
        self.stdout.write("📍 Try accessing the upload form directly at:")
        self.stdout.write("   http://localhost:8000/admin/api/translation/upload-csv/")
        
        self.stdout.write("\n🎯 CSV Upload Test Summary:")
        self.stdout.write("   - Validation logic: Working" if result['valid'] else "   - Validation logic: Failed")
        self.stdout.write("   - Admin URL routing: Check manually")
        self.stdout.write("   - Direct access: Try the URL above") 