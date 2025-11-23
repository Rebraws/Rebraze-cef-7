#!/bin/bash
# Build script for macOS

set -e

echo "Building Rebraze for macOS..."

# Check if CEF is downloaded
if [ ! -d "third_party/cef_binary" ]; then
    echo "CEF not found. Downloading..."
    ./scripts/download_cef.sh
fi

# Build frontend if not already built
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Create build directory
mkdir -p build
cd build

# Run CMake
echo "Running CMake..."
cmake -DCMAKE_BUILD_TYPE=Release -G "Xcode" ..

# Build
echo "Building C++ application..."
xcodebuild -project Rebraze.xcodeproj -configuration Release

echo ""
echo "Build complete!"
echo "Application bundle: build/Release/Rebraze.app"
echo ""
echo "To run: open build/Release/Rebraze.app"
