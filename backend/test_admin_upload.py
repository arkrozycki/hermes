#!/usr/bin/env python3
"""
Test script to verify the Django admin CSV upload functionality.
This script creates a sample CSV file and provides instructions for testing.
"""

import csv
import os

def create_test_csv():
    """Create a test CSV file for admin upload testing"""
    test_data = [
        ['en', 'es', 'fr', 'de'],
        ['hello', 'hola', 'bonjour', 'hallo'],
        ['goodbye', 'adiós', 'au revoir', 'auf wiedersehen'],
        ['thank you', 'gracias', 'merci', 'danke'],
        ['please', 'por favor', 's\'il vous plaît', 'bitte'],
        ['yes', 'sí', 'oui', 'ja'],
        ['no', 'no', 'non', 'nein'],
        ['water', 'agua', 'eau', 'wasser'],
        ['food', 'comida', 'nourriture', 'essen'],
        ['house', 'casa', 'maison', 'haus'],
        ['car', 'coche', 'voiture', 'auto'],
        ['book', 'libro', 'livre', 'buch'],
        ['computer', 'computadora', 'ordinateur', 'computer'],
        ['phone', 'teléfono', 'téléphone', 'telefon'],
        ['time', 'tiempo', 'temps', 'zeit']
    ]
    
    filename = 'test_translations.csv'
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(test_data)
    
    print(f"✅ Created test CSV file: {filename}")
    print(f"📁 File location: {os.path.abspath(filename)}")
    return filename

def create_invalid_csv():
    """Create an invalid CSV file to test validation"""
    invalid_data = [
        ['en', 'es', ''],  # Empty header
        ['hello', 'hola'],  # Missing column
        ['goodbye', 'adiós', 'au revoir'],  # Extra column
        ['', 'gracias', 'merci'],  # Empty source
        ['please', '', 's\'il vous plaît'],  # Empty target
    ]
    
    filename = 'invalid_test.csv'
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(invalid_data)
    
    print(f"⚠️  Created invalid test CSV file: {filename}")
    print(f"📁 File location: {os.path.abspath(filename)}")
    return filename

def main():
    print("=== Django Admin CSV Upload Test ===\n")
    
    # Create test files
    valid_file = create_test_csv()
    invalid_file = create_invalid_csv()
    
    print("\n" + "="*50)
    print("🧪 TESTING INSTRUCTIONS")
    print("="*50)
    
    print("\n1️⃣  **Start Django Server:**")
    print("   python manage.py runserver")
    
    print("\n2️⃣  **Access Django Admin:**")
    print("   http://localhost:8000/admin/")
    
    print("\n3️⃣  **Login with admin credentials**")
    
    print("\n4️⃣  **Navigate to Translations:**")
    print("   Go to: API → Translations")
    
    print("\n5️⃣  **Upload CSV File:**")
    print("   Option A: Click '📁 Upload CSV' button in the top right")
    print("   Option B: Use 'Upload translations from CSV file' in Actions dropdown")
    
    print("\n6️⃣  **Test Valid File:**")
    print(f"   Upload: {valid_file}")
    print("   Expected: Success with 42 translations added (14 rows × 3 target languages)")
    
    print("\n7️⃣  **Test Invalid File:**")
    print(f"   Upload: {invalid_file}")
    print("   Expected: Validation errors for empty headers, malformed rows, etc.")
    
    print("\n8️⃣  **Check Results:**")
    print("   - Look for success/error messages")
    print("   - Check the translations list for new entries")
    print("   - Review Django logs for detailed information")
    
    print("\n" + "="*50)
    print("📋 VALIDATION FEATURES TO TEST")
    print("="*50)
    
    print("\n✅ **Header Validation:**")
    print("   - Empty column names")
    print("   - Duplicate language codes")
    print("   - Invalid language code format")
    print("   - Missing source language")
    
    print("\n✅ **Data Validation:**")
    print("   - Row column count consistency")
    print("   - Empty source/target texts")
    print("   - Malformed rows")
    print("   - File encoding (UTF-8)")
    
    print("\n✅ **Processing Features:**")
    print("   - Duplicate detection and skipping")
    print("   - Error reporting with row numbers")
    print("   - Success statistics")
    print("   - Comprehensive logging")
    
    print(f"\n📁 **Test Files Created:**")
    print(f"   Valid: {valid_file}")
    print(f"   Invalid: {invalid_file}")
    
    print("\n🎯 **Expected Results:**")
    print("   - Valid file: 42 translations added (14 rows × 3 languages)")
    print("   - Invalid file: Validation errors, no translations added")
    print("   - Clear error messages and success feedback")

if __name__ == "__main__":
    main() 