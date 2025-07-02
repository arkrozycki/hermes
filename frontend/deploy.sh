#!/bin/bash

# Hermes PWA Deployment Script
set -e

echo "🚀 Starting Hermes PWA deployment..."

# Configuration
SERVER_USER="your-username"
SERVER_HOST="hermes.beargrass.io"
SERVER_PATH="/var/www/hermes"
LOCAL_BUILD_DIR="./app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.local exists
if [ ! -f "renderer/.env.local" ]; then
    print_warning "Creating renderer/.env.local with production settings..."
    cat > renderer/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://hermes.beargrass.io/api
NEXT_PUBLIC_AUTH_ENABLED=true
NODE_ENV=production
EOF
    print_status "Created renderer/.env.local"
else
    print_status "Using existing renderer/.env.local"
fi

# Build the PWA
print_status "Building PWA for production..."
cd renderer
npm run next:build
cd ..

# Check if build directory exists
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    print_error "Build directory $LOCAL_BUILD_DIR not found. Build may have failed."
    exit 1
fi

print_status "Build completed successfully!"

# Sync files to server
print_status "Syncing files to server..."
rsync -avz --delete \
    --exclude='.env*' \
    --exclude='node_modules' \
    --exclude='.git' \
    "$LOCAL_BUILD_DIR/" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

print_status "Files synced to server!"

# Instructions for server setup
echo ""
echo "🔧 Next steps on your Ubuntu server:"
echo ""
echo "1. Copy the nginx configuration:"
echo "   sudo cp $(pwd)/nginx-hermes.conf /etc/nginx/sites-available/hermes"
echo "   sudo ln -sf /etc/nginx/sites-available/hermes /etc/nginx/sites-enabled/"
echo "   sudo rm -f /etc/nginx/sites-enabled/default  # if needed"
echo ""
echo "2. Test nginx configuration:"
echo "   sudo nginx -t"
echo ""
echo "3. Reload nginx:"
echo "   sudo systemctl reload nginx"
echo ""
echo "4. Set up SSL certificate with Let's Encrypt (if not already done):"
echo "   sudo certbot --nginx -d hermes.beargrass.io"
echo ""
echo "5. Ensure your backend API is running on port 8000"
echo ""
print_status "Deployment completed! 🎉"
print_status "Your PWA should be available at: https://hermes.beargrass.io"

# Additional PWA verification steps
echo ""
echo "🔍 PWA Verification checklist:"
echo "✅ Check manifest.json at: https://hermes.beargrass.io/manifest.json"
echo "✅ Check service worker at: https://hermes.beargrass.io/sw.js"
echo "✅ Test offline functionality in browser DevTools"
echo "✅ Test 'Add to Home Screen' on mobile devices"
echo "✅ Verify API endpoints work: https://hermes.beargrass.io/api/" 