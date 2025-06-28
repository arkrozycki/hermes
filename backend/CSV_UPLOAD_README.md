# CSV Translation Upload Feature

This feature allows you to bulk upload translations from a CSV file to the translation database with comprehensive pre-validation.

## API Endpoint

**POST** `/api/translations/upload-csv`

## Authentication

Requires authentication token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Request Format

The request should be a multipart form with:

- `file`: CSV file containing translations
- `source_language` (optional): Source language code (defaults to first column)

## CSV Format

The CSV file should have the following structure:

```csv
en,es,fr,de
hello,hola,bonjour,hallo
goodbye,adiós,au revoir,auf wiedersehen
thank you,gracias,merci,danke
```

### Requirements:

- **Header row**: Contains language codes (e.g., 'en', 'es', 'fr', 'de')
- **Data rows**: Each row contains translations for the same concept
- **Source language**: Typically the first column, but can be specified via `source_language` parameter
- **Target languages**: All other columns are treated as target languages
- **Encoding**: File must be UTF-8 encoded

### Example CSV:

```csv
en,es,fr,de
hello,hola,bonjour,hallo
goodbye,adiós,au revoir,auf wiedersehen
thank you,gracias,merci,danke
please,por favor,s'il vous plaît,bitte
```

## Response Format

```json
{
  "message": "CSV upload completed",
  "added_count": 15,
  "skipped_count": 3,
  "total_processed": 18,
  "errors": [],
  "source_language": "en",
  "target_languages": ["es", "fr", "de"],
  "total_rows_processed": 5
}
```

### Response Fields:

- `added_count`: Number of new translations added to the database
- `skipped_count`: Number of duplicates that were skipped
- `total_processed`: Total number of translation pairs processed
- `errors`: List of any errors encountered during processing
- `source_language`: The source language used
- `target_languages`: List of target languages processed
- `total_rows_processed`: Total number of data rows in the CSV

## Comprehensive Validation

The system performs extensive pre-validation before processing any translations:

### ✅ **Header Validation**

- **Minimum columns**: At least 2 columns required (source + target)
- **Empty headers**: No empty column names allowed
- **Duplicate languages**: No duplicate language codes in header
- **Language code format**: Validates 2-3 letter language codes
- **Source language**: Ensures specified source language exists in header

### ✅ **Data Structure Validation**

- **Row consistency**: All rows must have the same number of columns as header
- **Empty data detection**: Identifies empty source and target texts
- **Data quality metrics**: Tracks malformed rows and empty fields

### ✅ **Critical Issue Detection**

- **No data rows**: Rejects files with no data rows
- **Too many malformed rows**: Rejects if >50% of rows have wrong column count
- **Too many empty sources**: Rejects if >80% of source texts are empty

### ✅ **Language Code Validation**

Supports common ISO language codes including:

- **Major languages**: en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, bn, ur, th, vi
- **European languages**: nl, sv, da, no, fi, pl, cs, sk, hu, ro, bg, hr, sr, sl, et, lv, lt
- **Regional languages**: eu, ca, gl, is, fo, sq, mk, bs, me, ky, kk, uz, tk, mn, ka, hy, az, be, uk, mo
- **And many more**: Comprehensive list of 100+ language codes

## Features

### Duplicate Handling

- Automatically detects and skips existing translations
- Uses the unique constraint on `(source_text, source_language, target_language)`
- Logs skipped duplicates for transparency

### Error Handling

- **Pre-validation**: Scans entire file before processing
- **Detailed error reporting**: Specific errors for each problematic row
- **Graceful degradation**: Continues processing despite individual row errors
- **Comprehensive logging**: Detailed validation and processing logs

### Logging

- Logs each translation added or skipped
- Provides validation summary statistics
- Includes error details for debugging
- Performance metrics for large files

## Usage Examples

### Using curl:

```bash
curl -X POST \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@translations.csv" \
  -F "source_language=en" \
  http://localhost:8000/api/translations/upload-csv
```

### Using Python requests:

```python
import requests

url = "http://localhost:8000/api/translations/upload-csv"
headers = {"Authorization": "Bearer <your_token>"}
files = {"file": open("translations.csv", "rb")}
data = {"source_language": "en"}

response = requests.post(url, headers=headers, files=files, data=data)
result = response.json()
print(f"Added: {result['added_count']}, Skipped: {result['skipped_count']}")
```

### Using the test script:

```bash
python test_csv_upload.py
```

## Error Codes

- `400 Bad Request`: Invalid CSV format, validation errors, or missing file
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server-side processing errors

## Common Validation Errors

### Header Issues:

- **"CSV must have at least 2 columns"**: Add more language columns
- **"CSV header contains empty column names"**: Remove empty columns
- **"Duplicate language codes found in header"**: Remove duplicate language codes
- **"Invalid language code format"**: Use standard 2-3 letter codes

### Data Issues:

- **"CSV file contains no data rows"**: Add data rows after header
- **"Too many malformed rows"**: Fix column count consistency
- **"Too many empty source texts"**: Fill in missing source texts
- **"Source language not found in CSV header"**: Check source language setting

## Best Practices

1. **File Encoding**: Ensure CSV files are UTF-8 encoded
2. **Language Codes**: Use standard ISO language codes (e.g., 'en', 'es', 'fr')
3. **Data Quality**: Clean your data before upload to minimize errors
4. **Test Validation**: Use small test files to validate format before bulk uploads
5. **Backup**: Always backup your database before bulk uploads
6. **Consistent Format**: Ensure all rows have the same number of columns

## Security Considerations

- Only authenticated users can upload translations
- File size limits may be enforced by your server configuration
- CSV content is thoroughly validated to prevent injection attacks
- All file operations are performed securely with proper error handling
- Pre-validation prevents partial uploads of invalid files

## Performance

- **Pre-validation**: Scans entire file before processing to prevent partial uploads
- **Efficient processing**: Only processes files that pass validation
- **Memory efficient**: Processes files in chunks to handle large datasets
- **Logging optimization**: Comprehensive logging without performance impact
