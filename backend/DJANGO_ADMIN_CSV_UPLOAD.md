# Django Admin CSV Upload Feature

This feature allows you to upload translations from CSV files directly through the Django admin interface.

## How to Access

1. **Navigate to Django Admin**: Go to `http://localhost:8000/admin/`
2. **Login**: Use your admin credentials
3. **Go to Translations**: Click on "Translations" under the "API" section
4. **Upload CSV**: You have two options:
   - **Option 1**: Use the "Upload translations from CSV file" action in the actions dropdown
   - **Option 2**: The upload form will be available directly on the translations list page

## CSV Format Requirements

Your CSV file should follow this format:

```csv
en,es,fr,de
hello,hola,bonjour,hallo
goodbye,adiós,au revoir,auf wiedersehen
thank you,gracias,merci,danke
please,por favor,s'il vous plaît,bitte
```

### Format Rules:

- **Header Row**: Must contain language codes (e.g., `en`, `es`, `fr`, `de`)
- **Data Rows**: Each row contains translations for the same concept
- **Source Language**: Typically the first column, but can be specified in the form
- **Target Languages**: All other columns are treated as target languages
- **Encoding**: File must be UTF-8 encoded

## Upload Process

1. **Select File**: Choose your CSV file using the file input
2. **Set Source Language** (Optional): If not specified, the first column will be used
3. **Upload**: Click the "Upload CSV" button
4. **Review Results**: You'll see a success message with:
   - Number of translations added
   - Number of duplicates skipped
   - Number of errors (if any)

## Features

### ✅ **Duplicate Detection**

- Automatically detects existing translations
- Skips duplicates without overwriting
- Logs skipped items for transparency

### ✅ **Error Handling**

- Validates CSV format and structure
- Reports specific errors with row numbers
- Continues processing despite individual row errors
- Shows up to 5 errors in the admin interface

### ✅ **User-Friendly Interface**

- Clean, intuitive form design
- Clear instructions and examples
- Real-time feedback on upload results
- Proper breadcrumb navigation

### ✅ **Security**

- CSRF protection enabled
- File type validation
- Admin authentication required
- Secure file processing

## Example Usage

### Step 1: Prepare Your CSV

Create a file named `translations.csv`:

```csv
en,es,fr,de
hello,hola,bonjour,hallo
goodbye,adiós,au revoir,auf wiedersehen
thank you,gracias,merci,danke
```

### Step 2: Upload via Admin

1. Go to Django Admin → API → Translations
2. Click "Upload translations from CSV file" in the actions dropdown
3. Select your CSV file
4. Optionally specify source language (e.g., "en")
5. Click "Upload CSV"

### Step 3: Review Results

You'll see a success message like:

```
CSV upload completed successfully! Added: 12, Skipped: 0, Errors: 0
```

## Error Messages

Common error messages and their solutions:

- **"File must be a CSV file"**: Ensure your file has a `.csv` extension
- **"CSV file is empty"**: Check that your file contains data
- **"CSV must have at least 2 columns"**: Add more language columns
- **"Source language not found in CSV header"**: Check your source language setting
- **"CSV file must be UTF-8 encoded"**: Re-save your file with UTF-8 encoding

## Best Practices

1. **Test with Small Files**: Start with a few rows to test the format
2. **Check Encoding**: Ensure your CSV is saved as UTF-8
3. **Validate Data**: Clean your data before upload
4. **Backup Database**: Always backup before bulk uploads
5. **Use Standard Language Codes**: Use ISO language codes (e.g., 'en', 'es', 'fr')

## Troubleshooting

### Upload Not Working?

- Check that you're logged in as an admin user
- Ensure the file is a valid CSV
- Verify the file is UTF-8 encoded
- Check the browser console for JavaScript errors

### Wrong Language Codes?

- Use standard ISO language codes
- Ensure language codes match your existing translations
- Check that the source language exists in your CSV header

### Duplicates Not Being Skipped?

- Check the unique constraint on your Translation model
- Verify that existing translations have the same source text and language codes
- Review the logs for skipped items

## Integration with API

This admin feature works alongside the API endpoint (`/api/translations/upload-csv`). Both use the same underlying logic for processing CSV files, ensuring consistency across your application.

## Logging

All upload activities are logged with detailed information:

- Each translation added or skipped
- Error details for problematic rows
- Summary statistics for each upload
- Performance metrics for large files

Check your Django logs for detailed information about upload processing.
