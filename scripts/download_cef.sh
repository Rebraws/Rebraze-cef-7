#!/bin/bash
# Script to download Chromium Embedded Framework (CEF) binary distribution

set -e

# CEF version to download
CEF_VERSION="120.1.10+g3ce3184+chromium-120.0.6099.129"

# Detect platform
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux64"
    ARCHIVE_EXT="tar.bz2"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macosx64"
    ARCHIVE_EXT="tar.bz2"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    PLATFORM="windows64"
    ARCHIVE_EXT="tar.bz2"
else
    echo "Unknown operating system: $OSTYPE"
    exit 1
fi

# Build type (standard or minimal)
BUILD_TYPE="standard"

# Construct download URL
CEF_FILENAME="cef_binary_${CEF_VERSION}_${PLATFORM}"
DOWNLOAD_URL="https://cef-builds.spotifycdn.com/${CEF_FILENAME}.${ARCHIVE_EXT}"

echo "Downloading CEF for ${PLATFORM}..."
echo "URL: ${DOWNLOAD_URL}"

# Create third_party directory if it doesn't exist
mkdir -p third_party
cd third_party

# Download CEF if not already downloaded
if [ ! -f "${CEF_FILENAME}.${ARCHIVE_EXT}" ]; then
    echo "Downloading ${CEF_FILENAME}.${ARCHIVE_EXT}..."
    curl -L -o "${CEF_FILENAME}.${ARCHIVE_EXT}" "${DOWNLOAD_URL}"
else
    echo "CEF archive already exists, skipping download"
fi

# Extract if not already extracted
if [ ! -d "cef_binary" ]; then
    echo "Extracting CEF..."
    tar -xjf "${CEF_FILENAME}.${ARCHIVE_EXT}"

    # Rename extracted directory to cef_binary for consistency
    mv "${CEF_FILENAME}" cef_binary

    echo "CEF extracted to third_party/cef_binary"
else
    echo "CEF already extracted"
fi

echo "CEF download and extraction complete!"
echo ""
echo "Next steps:"
echo "1. Build the frontend: cd frontend && npm install && npm run build"
echo "2. Build the C++ app: ./scripts/build_linux.sh (or build_mac.sh / build_win.bat)"
