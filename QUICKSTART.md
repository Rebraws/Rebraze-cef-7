# Rebraze Desktop - Quick Start Guide

Get up and running with Rebraze Desktop in minutes!

## Prerequisites Check

Make sure you have:
- ✅ CMake 3.19+
- ✅ Node.js 16+
- ✅ C++ compiler (GCC 7.3+, Visual Studio 2019+, or Xcode)

## Quick Build (3 Steps)

### 1. Download CEF

```bash
./scripts/download_cef.sh
```

⏱️ This takes 5-10 minutes (downloads ~500MB)

### 2. Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

⏱️ Takes 2-3 minutes

### 3. Build Desktop App

**Linux:**
```bash
./scripts/build_linux.sh
```

**macOS:**
```bash
./scripts/build_mac.sh
```

**Windows:**
```cmd
scripts\build_win.bat
```

⏱️ Takes 5-10 minutes for first build

## Run the App

**Linux:**
```bash
cd build && ./Rebraze
```

**macOS:**
```bash
open build/Release/Rebraze.app
```

**Windows:**
```cmd
cd build\Release && Rebraze.exe
```

## Common Issues

### "CEF not found"
Run `./scripts/download_cef.sh` first

### "Frontend not loading"
Make sure you built the frontend: `cd frontend && npm run build`

### Build fails on Linux
Install dependencies:
```bash
sudo apt-get install build-essential libgtk-3-dev libglib2.0-dev
```

## Development Tips

### Frontend Hot Reload

For faster frontend development:

1. Run Vite dev server:
   ```bash
   cd frontend && npm run dev
   ```

2. In `cef_app/src/app.cpp`, modify the URL to point to the dev server:
   ```cpp
   url = "http://localhost:3000";
   ```

3. Rebuild C++ app once

Now frontend changes reload automatically!

### Enable DevTools

In `cef_app/src/main.cpp`, find and uncomment the following line:
```cpp
// settings.remote_debugging_port = 9222;
```

Then open `http://localhost:9222` in Chrome for debugging.

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the codebase in `cef_app/` (C++) and `frontend/` (React)
- Customize window size in `cef_app/src/app.cpp`
- Add native features via CEF APIs

## Support

For issues and questions:
- Check [README.md](README.md) Troubleshooting section
- CEF Documentation: https://bitbucket.org/chromiumembedded/cef/wiki/Home
- CEF Forum: https://magpcss.org/ceforum/

Happy coding! 🚀
