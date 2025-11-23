@echo off
REM Build script for Windows

echo Building Rebraze for Windows...

REM Check if CEF is downloaded
if not exist "third_party\cef_binary" (
    echo CEF not found. Please run download_cef.sh in Git Bash or WSL
    exit /b 1
)

REM Build frontend if not already built
if not exist "frontend\dist" (
    echo Building frontend...
    cd frontend
    call npm install
    call npm run build
    cd ..
)

REM Create build directory
if not exist "build" mkdir build
cd build

REM Run CMake (assumes Visual Studio is installed)
echo Running CMake...
cmake -G "Visual Studio 17 2022" -A x64 ..

REM Build
echo Building C++ application...
cmake --build . --config Release

echo.
echo Build complete!
echo Executable: build\Release\Rebraze.exe
echo.
echo To run: cd build\Release ^&^& Rebraze.exe
