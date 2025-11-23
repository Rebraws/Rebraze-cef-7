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
cd "$PROJECT_DIR/build"

# Run make to trigger the copy_frontend target
# This will only copy files, not rebuild C++ code (unless it changed)
make copy_frontend

echo ""
echo "[3/3] Verification..."
DEST_FILE="$PROJECT_DIR/build/Release/resources/frontend/index.html"
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
echo "  cd $PROJECT_DIR/build/Release"
echo "  ./Rebraze"
echo ""
