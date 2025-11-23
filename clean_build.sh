#!/bin/bash

set -e  # Exit on error

echo "======================================"
echo "Cleaning and rebuilding Rebraze CEF app"
echo "======================================"

# Get the project root directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "[1/5] Cleaning old build artifacts..."
rm -rf "$PROJECT_DIR/build"
rm -rf "$PROJECT_DIR/frontend/dist"
rm -rf "$PROJECT_DIR/frontend/.vite"

echo ""
echo "[2/5] Building frontend..."
cd "$PROJECT_DIR/frontend"
npm run build

echo ""
echo "[3/5] Creating build directory..."
mkdir -p "$PROJECT_DIR/build"
cd "$PROJECT_DIR/build"

echo ""
echo "[4/5] Running CMake..."
cmake ..

echo ""
echo "[5/5] Building CEF app..."
make -j$(nproc)

echo ""
echo "======================================"
echo "✓ Build complete!"
echo "======================================"
echo ""
echo "To run the app:"
echo "  cd $PROJECT_DIR/build"
echo "  ./Rebraze"
echo ""
echo "Make sure your backend is running with:"
echo "  FRONTEND_URL=http://localhost:8765"
echo ""
