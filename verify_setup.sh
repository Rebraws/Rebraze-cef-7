#!/bin/bash

echo "======================================"
echo "Verifying Rebraze CEF OAuth Setup"
echo "======================================"
echo ""

# Check if backend .env exists
BACKEND_ENV="/home/rebraws/Rebraze/Mutiny/src/backend/.env"

if [ ! -f "$BACKEND_ENV" ]; then
    echo "✗ Backend .env file not found at: $BACKEND_ENV"
    echo "  Please create it using backend.env.example as a template"
    exit 1
fi

echo "Checking backend environment variables..."
echo ""

# Check FRONTEND_URL
FRONTEND_URL=$(grep "^FRONTEND_URL=" "$BACKEND_ENV" | cut -d '=' -f2)
if [ "$FRONTEND_URL" = "http://localhost:8765" ]; then
    echo "✓ FRONTEND_URL is correctly set to http://localhost:8765"
else
    echo "✗ FRONTEND_URL is set to: $FRONTEND_URL"
    echo "  For CEF app, it should be: http://localhost:8765"
    echo "  Please update $BACKEND_ENV"
fi

# Check GOOGLE_REDIRECT_URI
GOOGLE_REDIRECT_URI=$(grep "^GOOGLE_REDIRECT_URI=" "$BACKEND_ENV" | cut -d '=' -f2)
if [ -n "$GOOGLE_REDIRECT_URI" ]; then
    echo "✓ GOOGLE_REDIRECT_URI is set to: $GOOGLE_REDIRECT_URI"
else
    echo "✗ GOOGLE_REDIRECT_URI is not set"
    echo "  Please set it in $BACKEND_ENV"
fi

# Check GOOGLE_CLIENT_ID
GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" "$BACKEND_ENV" | cut -d '=' -f2)
if [ -n "$GOOGLE_CLIENT_ID" ] && [ "$GOOGLE_CLIENT_ID" != "your-google-client-id.apps.googleusercontent.com" ]; then
    echo "✓ GOOGLE_CLIENT_ID is configured"
else
    echo "✗ GOOGLE_CLIENT_ID needs to be set"
    echo "  Please configure it in $BACKEND_ENV"
fi

# Check GOOGLE_CLIENT_SECRET
GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" "$BACKEND_ENV" | cut -d '=' -f2)
if [ -n "$GOOGLE_CLIENT_SECRET" ] && [ "$GOOGLE_CLIENT_SECRET" != "your-google-client-secret" ]; then
    echo "✓ GOOGLE_CLIENT_SECRET is configured"
else
    echo "✗ GOOGLE_CLIENT_SECRET needs to be set"
    echo "  Please configure it in $BACKEND_ENV"
fi

echo ""
echo "Checking build artifacts..."
echo ""

# Check if CEF binary exists
if [ -f "build/Rebraze" ]; then
    echo "✓ CEF app binary found"
    BUILD_DATE=$(stat -c %y build/Rebraze 2>/dev/null || stat -f %Sm build/Rebraze 2>/dev/null)
    echo "  Last built: $BUILD_DATE"
else
    echo "✗ CEF app binary not found"
    echo "  Run ./clean_build.sh to build"
fi

# Check if frontend is built
if [ -d "frontend/dist" ]; then
    echo "✓ Frontend dist folder found"
    DIST_DATE=$(stat -c %y frontend/dist 2>/dev/null || stat -f %Sm frontend/dist 2>/dev/null)
    echo "  Last built: $DIST_DATE"
else
    echo "✗ Frontend dist folder not found"
    echo "  Run ./clean_build.sh to build"
fi

# Check if backend is running
echo ""
echo "Checking if backend is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1 || curl -s http://0.0.0.0:8000/health > /dev/null 2>&1; then
    echo "✓ Backend is running on port 8000"
else
    echo "✗ Backend is not running on port 8000"
    echo "  Start it with: cd /home/rebraws/Rebraze/Mutiny/src/backend && cargo run"
fi

echo ""
echo "======================================"
echo "Verification complete"
echo "======================================"
