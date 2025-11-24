#!/bin/bash

set -e

echo "======================================"
echo "Updating Frontend in CEF App"
echo "======================================"

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "[1/3] Building frontend..."
cd "$PROJECT_DIR/frontend"
npm run build

echo ""
echo "[2/3] Copying to CEF app..."

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - copy directly to app bundle
    DEST_DIR="$PROJECT_DIR/build/Release/Rebraze.app/Contents/Resources/frontend"
    mkdir -p "$DEST_DIR"
    cp -r "$PROJECT_DIR/frontend/dist/"* "$DEST_DIR/"
    echo "  Copied to: $DEST_DIR"
else
    # Linux/Windows - use the copy_frontend target
    cd "$PROJECT_DIR/build"
    if command -v ninja &> /dev/null && [ -f build.ninja ]; then
        ninja copy_frontend
    else
        make copy_frontend
    fi
fi

echo ""
echo "[3/3] Verification..."

# Detect platform for verification
if [[ "$OSTYPE" == "darwin"* ]]; then
    DEST_FILE="$PROJECT_DIR/build/Release/Rebraze.app/Contents/Resources/frontend/index.html"
    RUN_CMD="open $PROJECT_DIR/build/Release/Rebraze.app"
else
    DEST_FILE="$PROJECT_DIR/build/Release/resources/frontend/index.html"
    RUN_CMD="cd $PROJECT_DIR/build/Release && ./Rebraze"
fi

if [ -f "$DEST_FILE" ]; then
    echo "✓ Frontend files copied successfully"
    echo "  Modified: $(stat -c %y "$DEST_FILE" 2>/dev/null || stat -f %Sm "$DEST_FILE" 2>/dev/null)"
else
    echo "✗ Frontend files not found at expected location"
    echo "  Looking for: $DEST_FILE"
fi

echo ""
echo "======================================"
echo "✓ Frontend updated!"
echo "======================================"
echo ""
echo "You can now run the app:"
echo "  $RUN_CMD"
echo ""
