#!/bin/bash
# Build script for macOS

set -e

echo "Building Rebraze for macOS..."

# Check if Ninja is installed
if ! command -v ninja &> /dev/null; then
    echo "Error: Ninja is not installed."
    echo "Please install Ninja using Homebrew:"
    echo "  brew install ninja"
    echo ""
    echo "Or download it from: https://ninja-build.org/"
    exit 1
fi

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
echo "Running CMake with Ninja generator..."
cmake -DCMAKE_BUILD_TYPE=Release -G "Ninja" ..

# Build
echo "Building C++ application with Ninja..."
ninja

echo ""
echo "Build complete!"
echo "Application bundle: build/Rebraze.app"
echo ""
echo "To run: open build/Rebraze.app"
