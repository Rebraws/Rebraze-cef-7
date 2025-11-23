#!/bin/bash
# Build script for Linux

set -e

echo "Building Rebraze for Linux..."

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
cmake -DCMAKE_BUILD_TYPE=Release ..

# Build
echo "Building C++ application..."
make -j$(nproc)

echo ""
echo "Build complete!"
echo "Executable: build/Rebraze"
echo ""
echo "To run: cd build && ./Rebraze"
