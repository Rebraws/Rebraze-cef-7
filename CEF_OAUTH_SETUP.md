# CEF OAuth Setup Guide

This guide explains how to configure Google OAuth authentication to work with the CEF (Chromium Embedded Framework) desktop application.

## How It Works

The CEF app uses a **system browser OAuth flow** to bypass Google's restrictions on embedded browsers:

1. User clicks "Continue with Google" in the CEF app
2. CEF opens the OAuth URL in the user's default system browser (Chrome, Firefox, etc.)
3. User logs in with Google in the real browser
4. After authentication, Google redirects to your backend at `http://0.0.0.0:8000/auth/google/callback`
5. Your backend exchanges the OAuth code for a token
6. Backend redirects to `http://localhost:8765/callback?token=...`
7. CEF's local HTTP server (running on port 8765) receives the token
8. CEF passes the token to the React app via JavaScript bridge
9. User is logged in!

## Backend Configuration

### Environment Variables

Update your backend's `.env` file at `/home/rebraws/Rebraze/Mutiny/src/backend/.env`:

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION_HOURS=24

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# IMPORTANT: This should point to your backend's callback endpoint
GOOGLE_REDIRECT_URI=http://0.0.0.0:8000/auth/google/callback

# IMPORTANT: Change this to point to the CEF OAuth callback server
# The CEF app runs a local HTTP server on port 8765 to receive the token
FRONTEND_URL=http://localhost:8765
```

### Key Points

1. **GOOGLE_REDIRECT_URI**: Keep this as `http://0.0.0.0:8000/auth/google/callback`
   - This is where Google redirects after user authorizes
   - This must match the redirect URI configured in Google Cloud Console

2. **FRONTEND_URL**: Change this to `http://localhost:8765`
   - This is where your backend redirects after exchanging the OAuth code for a token
   - The CEF app's OAuth server listens on port 8765
   - In production CEF, this stays as `http://localhost:8765`
   - If testing the web version (Vite dev server), change it back to `http://localhost:5173`

## Google Cloud Console Configuration

Make sure your Google OAuth app is configured correctly:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   http://0.0.0.0:8000/auth/google/callback
   http://localhost:8000/auth/google/callback
   ```

## Development Workflow

### Testing the CEF App

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Build the CEF app:
   ```bash
   cd ..
   mkdir -p build && cd build
   cmake ..
   make
   ```

3. Set backend env vars for CEF:
   ```bash
   export FRONTEND_URL=http://localhost:8765
   ```

4. Start the backend:
   ```bash
   cd /home/rebraws/Rebraze/Mutiny/src/backend
   cargo run
   ```

5. Run the CEF app:
   ```bash
   cd /home/rebraws/Programming/Rebraze-cpp-project/build
   ./Rebraze
   ```

### Testing the Web App (Vite Dev Server)

1. Set backend env vars for web:
   ```bash
   export FRONTEND_URL=http://localhost:5173
   ```

2. Start the backend:
   ```bash
   cd /home/rebraws/Rebraze/Mutiny/src/backend
   cargo run
   ```

3. Start the frontend:
   ```bash
   cd /home/rebraws/Programming/Rebraze-cpp-project/frontend
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Troubleshooting

### "This browser or app may not be secure" Error

If you still see this error:
- Make sure `FRONTEND_URL` is set to `http://localhost:8765`
- Verify the backend is running on port 8000
- Check that the OAuth callback server started (you should see "OAuth callback server started on http://localhost:8765" in the CEF console)

### Token Not Received in CEF App

1. Check the CEF console for errors
2. Verify the backend redirected to `http://localhost:8765/callback?token=...`
3. Make sure the OAuth callback server is running on port 8765
4. Check browser console for JavaScript errors

### Port 8765 Already in Use

If port 8765 is already in use, you can change it:

1. Edit `cef_app/src/app.cpp`:
   ```cpp
   const int OAUTH_PORT = 8765;  // Change to another port
   ```

2. Rebuild the CEF app

3. Update `FRONTEND_URL` in the backend to match:
   ```bash
   export FRONTEND_URL=http://localhost:YOUR_NEW_PORT
   ```

## Architecture

```
┌─────────────┐                          ┌─────────────┐
│  CEF App    │                          │   Google    │
│  (Desktop)  │                          │   OAuth     │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
       │ 1. Click Login                         │
       │                                        │
       │ 2. Open System Browser ──────────────> │
       │                                        │
       │                                        │ 3. User Logs In
       │                                        │
       ▼                                        ▼
┌─────────────────────────────────────────────────┐
│           User's System Browser                 │
│         (Chrome/Firefox/Safari/etc.)            │
└─────────────────┬───────────────────────────────┘
                  │
                  │ 4. Redirect with code
                  ▼
         ┌─────────────────┐
         │  Rust Backend   │
         │  (Port 8000)    │
         └────────┬────────┘
                  │
                  │ 5. Exchange code for token
                  │
                  │ 6. Redirect to FRONTEND_URL
                  ▼
┌──────────────────────────────────────┐
│  CEF OAuth Server (Port 8765)        │
│  - Receives token                    │
│  - Shows success page in browser     │
│  - Sends token to CEF app            │
└───────────────┬──────────────────────┘
                │
                │ 7. JavaScript bridge
                │
┌───────────────▼──────────────────────┐
│  React App (in CEF)                  │
│  - Receives token                    │
│  - Stores in localStorage            │
│  - Navigates to dashboard            │
└──────────────────────────────────────┘
```

## Implementation Details

### CEF Components

1. **OAuthServer** (`cef_app/src/oauth_server.cpp`)
   - Simple HTTP server listening on port 8765
   - Extracts token from query parameters
   - Returns success/error HTML page
   - Triggers callback with token

2. **MessageHandler** (`cef_app/src/message_handler.cpp`)
   - Enables JavaScript-to-C++ communication
   - Exposes `window.rebrazeAuth.openSystemBrowser(url)` to JavaScript
   - Receives token from OAuth server
   - Sends token to React app via `window.onAuthTokenReceived(token)`

3. **ClientHandler** (`cef_app/src/client_handler.cpp`)
   - Handles process messages
   - Opens URLs in system browser

### Frontend Components

1. **CEF Bridge** (`frontend/src/utils/cefBridge.ts`)
   - Detects if running in CEF
   - Provides typed interface to CEF functions
   - Handles token callbacks

2. **Login Page** (`frontend/src/pages/Login.tsx`)
   - Uses system browser when in CEF
   - Falls back to normal redirect in web browser
   - Receives token via callback and stores it

## Security Considerations

1. **Local Server**: The OAuth callback server only runs locally and is not accessible from the internet
2. **Token Transmission**: Token is passed from backend → local HTTP server → CEF app → React app
3. **Browser Security**: User logs in through their real browser with all Google security features
4. **HTTPS**: In production, your backend should use HTTPS

## Future Improvements

- [ ] Use custom protocol handler (`rebraze://callback`) instead of local HTTP server
- [ ] Add token encryption between backend and CEF
- [ ] Implement token refresh flow
- [ ] Add support for multiple OAuth providers
- [ ] Handle concurrent OAuth requests
