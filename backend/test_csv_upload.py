#!/usr/bin/env python3
"""
Test script for the CSV upload endpoint.
This script demonstrates how to upload translations from a CSV file.
"""

import requests
import json
import csv
import io

# Configuration
BASE_URL = "http://localhost:8000/api"
CSV_FILE_PATH = "sample_translations.csv"

def create_sample_csv():
    """Create a sample CSV file for testing"""
    sample_data = [
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
        ['car', 'coche', 'voiture', 'auto']
    ]
    
    with open(CSV_FILE_PATH, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(sample_data)
    
    print(f"Created sample CSV file: {CSV_FILE_PATH}")

def get_auth_token(username, password):
    """Get authentication token"""
    url = f"{BASE_URL}/token"
    data = {
        'username': username,
        'password': password
    }
    
    response = requests.post(url, json=data)
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"Authentication failed: {response.text}")
        return None

def upload_csv_file(token, csv_file_path, source_language=None):
    """Upload CSV file with translations"""
    url = f"{BASE_URL}/translations/upload-csv"
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    data = {}
    if source_language:
        data['source_language'] = source_language
    
    files = {
        'file': open(csv_file_path, 'rb')
    }
    
    response = requests.post(url, headers=headers, data=data, files=files)
    files['file'].close()
    
    return response

def main():
    print("=== CSV Translation Upload Test ===\n")
    
    # Create sample CSV file
    create_sample_csv()
    
    # Get authentication token (replace with your credentials)
    print("Please enter your credentials:")
    username = input("Username: ")
    password = input("Password: ")
    
    token = get_auth_token(username, password)
    if not token:
        print("Failed to get authentication token. Exiting.")
        return
    
    print(f"\nAuthentication successful!")
    
    # Upload CSV file
    print(f"\nUploading CSV file: {CSV_FILE_PATH}")
    response = upload_csv_file(token, CSV_FILE_PATH, source_language='en')
    
    if response.status_code == 200:
        result = response.json()
        print("\n=== Upload Results ===")
        print(f"Message: {result['message']}")
        print(f"Added: {result['added_count']} translations")
        print(f"Skipped: {result['skipped_count']} duplicates")
        print(f"Total processed: {result['total_processed']}")
        print(f"Source language: {result['source_language']}")
        print(f"Target languages: {', '.join(result['target_languages'])}")
        
        if result['errors']:
            print(f"\nErrors ({len(result['errors'])}):")
            for error in result['errors']:
                print(f"  - {error}")
    else:
        print(f"Upload failed: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    main() 