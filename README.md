# Rebraze Desktop Application

Rebraze AI Workspace as a cross-platform desktop application built with C++ and Chromium Embedded Framework (CEF).

## Overview

This project combines a modern React TypeScript frontend with a C++ CEF backend to create a native desktop application for the Rebraze AI Workspace. The app provides AI-powered project management, file organization, and real-time chat capabilities using Google Gemini AI.

## Project Structure

```
Rebraze-cpp-project/
├── frontend/                  # React TypeScript web application
│   ├── src/                   # React source code
│   ├── public/                # Static assets
│   ├── dist/                  # Built frontend (generated)
│   ├── package.json           # Node dependencies
│   ├── vite.config.ts         # Vite build configuration
│   └── tsconfig.json          # TypeScript configuration
├── cef_app/                   # C++ CEF application
│   ├── include/               # Header files
│   │   ├── app.h              # Main CEF application class
│   │   └── client_handler.h   # Browser client handler
│   ├── src/                   # C++ source files
│   │   ├── main.cpp           # Cross-platform entry point
│   │   ├── app.cpp            # Application implementation
│   │   ├── client_handler.cpp # Client handler implementation
│   │   ├── main_linux.cpp     # Linux-specific code
│   │   ├── main_win.cpp       # Windows-specific code
│   │   ├── main_mac.mm        # macOS-specific code
│   │   └── process_helper_mac.cpp  # macOS helper process
│   └── resources/             # Application resources
├── scripts/                   # Build scripts
│   ├── download_cef.sh        # Download CEF binary distribution
│   ├── build_linux.sh         # Linux build script
│   ├── build_mac.sh           # macOS build script
│   └── build_win.bat          # Windows build script
├── third_party/               # Third-party dependencies
│   └── cef_binary/            # CEF binary distribution (downloaded)
├── build/                     # Build output directory (generated)
├── CMakeLists.txt             # CMake build configuration
└── README.md                  # This file
```

## Prerequisites

### All Platforms

- **CMake** (version 3.19 or later)
- **Node.js** (version 16 or later) and npm
- **Git**

### Linux

- GCC/G++ compiler (version 7.3 or later)
- Required libraries:
  ```bash
  sudo apt-get install build-essential libgtk-3-dev libglib2.0-dev \
    libx11-dev libxcomposite-dev libxdamage-dev libxi-dev \
    libxext-dev libxfixes-dev libxrandr-dev libxrender-dev \
    libxss-dev libxtst-dev libnss3-dev libcups2-dev \
    libdbus-1-dev libgconf-2-4 libgnome-keyring-dev \
    libasound2-dev libpulse-dev libpango1.0-dev
  ```

### macOS

- Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
- Xcode (for building the app bundle)

### Windows

- Visual Studio 2019 or later (with C++ development tools)
- Windows 10 SDK

## Build Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Rebraze-cpp-project
```

### Step 2: Download CEF

Run the download script to fetch the CEF binary distribution:

```bash
# Linux / macOS
./scripts/download_cef.sh

# Windows (use Git Bash or WSL)
./scripts/download_cef.sh
```

This will download and extract CEF to `third_party/cef_binary/`.

**Note:** The CEF download is approximately 500MB and may take several minutes.

### Step 3: Build the Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

This creates a production build of the React app in `frontend/dist/`.

### Step 4: Build the Desktop Application

#### Linux

```bash
./scripts/build_linux.sh
```

The executable will be located at `build/Rebraze`.

#### macOS

```bash
./scripts/build_mac.sh
```

The application bundle will be located at `build/Release/Rebraze.app`.

#### Windows

```cmd
scripts\build_win.bat
```

The executable will be located at `build\Release\Rebraze.exe`.

## Running the Application

### Linux

```bash
cd build
./Rebraze
```

### macOS

```bash
open build/Release/Rebraze.app
```

Or from the terminal:
```bash
./build/Release/Rebraze.app/Contents/MacOS/Rebraze
```

### Windows

```cmd
cd build\Release
Rebraze.exe
```

## Development Workflow

### Modifying the Frontend

1. Make changes to the React app in `frontend/src/`
2. Rebuild the frontend:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
3. Rebuild the CEF app (or just copy the `dist` folder):
   ```bash
   # Option 1: Full rebuild
   ./scripts/build_linux.sh  # or build_mac.sh / build_win.bat

   # Option 2: Just copy files (faster)
   cp -r frontend/dist build/resources/frontend/
   ```

### Modifying the C++ Code

1. Make changes to files in `cef_app/src/` or `cef_app/include/`
2. Rebuild:
   ```bash
   cd build
   make -j$(nproc)  # Linux
   # or
   xcodebuild -project Rebraze.xcodeproj -configuration Release  # macOS
   # or
   cmake --build . --config Release  # Windows
   ```

### Frontend Development Mode

For faster frontend iteration, you can run the Vite dev server:

```bash
cd frontend
npm run dev
```

Then modify `cef_app/src/app.cpp` to load `http://localhost:3000` instead of the local file.

## Architecture

### CEF Integration

The application uses Chromium Embedded Framework to render the React frontend in a native window. Key components:

- **App** (`app.h/cpp`): Main CEF application class, handles CEF initialization and browser creation
- **ClientHandler** (`client_handler.h/cpp`): Handles browser events (title changes, load errors, navigation, etc.)
- **Platform-specific files**: Handle window management for each OS

### Multi-Process Architecture

CEF uses a multi-process architecture similar to Chromium:

- **Browser Process**: Main application process (UI, browser management)
- **Renderer Process**: Handles web content rendering
- **GPU Process**: Hardware-accelerated graphics
- **Utility Processes**: Various helper processes

The `main.cpp` entry point handles process initialization and routing.

### Resource Loading

The React app is built into `frontend/dist/` and copied to `build/resources/frontend/` during the build process. The CEF browser loads the app from this local directory.

## Configuration

### CEF Settings

Modify `cef_app/src/main.cpp` to adjust CEF settings:

- **Remote Debugging**: Enable Chrome DevTools by uncommenting:
  ```cpp
  // settings.remote_debugging_port = 9222;
  ```
- **Cache Path**: Set a custom cache directory with `CefString(&settings.cache_path).FromASCII("path")`
- **Log Level**: Adjust logging verbosity with `settings.log_severity`

### Window Size

Modify the `GetPreferredSize()` method in `app.cpp` to change the default window size:

```cpp
CefSize GetPreferredSize(CefRefPtr<CefView> view) override {
  return CefSize(1280, 800);  // Width x Height
}
```

### Startup URL

By default, the app loads `file://resources/frontend/index.html`. To change this, modify the URL in `app.cpp`:

```cpp
url = "https://example.com";  // Or any other URL
```

Or pass it via command line:
```bash
./Rebraze --url=https://example.com
```

## Troubleshooting

### CEF Download Issues

If the CEF download fails, manually download it from:
https://cef-builds.spotifycdn.com/index.html

Choose the appropriate platform and extract to `third_party/cef_binary/`.

### Build Errors

1. **CMake can't find CEF**: Ensure `third_party/cef_binary` exists and contains the CEF distribution
2. **Missing dependencies on Linux**: Install the required libraries listed in Prerequisites
3. **Frontend not loading**: Make sure `frontend/dist` exists and was copied to `build/resources/frontend/`

### Runtime Issues

1. **Blank window**: Check that frontend files are in the correct location
2. **JavaScript errors**: Open Chrome DevTools by uncommenting `settings.remote_debugging_port = 9222` in `cef_app/src/main.cpp`, rebuild, and navigate to `http://localhost:9222` in Chrome

## Advanced Topics

### Custom Protocol Handlers

To handle custom URL schemes (e.g., `rebraze://`), implement a `CefSchemeHandlerFactory` in `app.cpp`.

### Native APIs

To expose native functionality to JavaScript, use CEF's JavaScript bindings:

1. Implement a `CefV8Handler` to handle JavaScript calls
2. Register handlers in the render process
3. Use `window.cefQuery()` for browser-to-native communication

### Distribution

#### Linux

Create a tarball or AppImage:
```bash
# Copy necessary files
mkdir -p Rebraze-linux
cp -r build/Rebraze build/*.so build/*.pak build/locales Rebraze-linux/
tar -czf Rebraze-linux.tar.gz Rebraze-linux/
```

#### macOS

Code sign and notarize the app bundle for distribution:
```bash
codesign --deep --force --verify --verbose --sign "Developer ID" build/Release/Rebraze.app
xcrun altool --notarize-app --primary-bundle-id "com.rebraze.app" --file Rebraze.zip
```

#### Windows

Create an installer using NSIS or WiX, or distribute as a ZIP file with all dependencies.

## License

Copyright (c) 2025 Rebraze. All rights reserved.

## Resources

- [CEF Documentation](https://bitbucket.org/chromiumembedded/cef/wiki/Home)
- [CEF Forum](https://magpcss.org/ceforum/)
- [CMake Documentation](https://cmake.org/documentation/)
- [React Documentation](https://react.dev/)
