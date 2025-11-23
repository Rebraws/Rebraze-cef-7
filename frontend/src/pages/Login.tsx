import React, { useState, useEffect } from 'react';
import { Sparkles, Chrome } from 'lucide-react';
import { authService } from '../services/authService';
import { isCEF, openSystemBrowser, setAuthTokenCallback } from '../utils/cefBridge';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up callback for CEF to send us the auth token
    if (isCEF()) {
      console.log('✓ Running in CEF mode - system browser OAuth enabled');
      console.log('✓ rebrazeAuth object available:', window.rebrazeAuth);
      setAuthTokenCallback((token: string) => {
        console.log('✓ Auth token received from CEF:', token.substring(0, 20) + '...');
        authService.setToken(token);
        // The AuthContext will detect the token and update isAuthenticated
        // which will cause App.tsx to show the dashboard
        setIsLoading(false);
        window.location.reload(); // Force a reload to trigger auth check
      });
    } else {
      console.log('✗ Running in web browser mode - normal OAuth redirect');
      console.log('✗ rebrazeAuth object:', window.rebrazeAuth);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.onAuthTokenReceived = undefined;
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('→ Getting Google auth URL from backend...');
      const { url } = await authService.getGoogleAuthUrl();
      console.log('→ Received auth URL:', url.substring(0, 50) + '...');

      // If running in CEF, open in system browser
      if (isCEF()) {
        console.log('✓ CEF detected - opening in system browser');
        const opened = openSystemBrowser(url);
        console.log('✓ System browser opened:', opened);
        if (!opened) {
          setError('Failed to open system browser. Please try again.');
          setIsLoading(false);
        } else {
          console.log('✓ Waiting for OAuth callback...');
        }
        // Keep loading state - we're waiting for the callback
      } else {
        // Regular web browser - redirect normally
        console.log('✗ Web browser mode - redirecting...');
        window.location.href = url;
      }
    } catch (err) {
      console.error('✗ Failed to initiate Google login:', err);
      setError('Failed to connect to authentication service. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video/Whisk_ijzwijmwujmknwm40iyhrwytigm1qtl5ajmh1in.mp4" type="video/mp4" />
      </video>

      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 via-pink-900/30 to-purple-900/40 backdrop-blur-[2px]"></div>

      {/* Login card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <span className="font-bold text-4xl italic font-serif tracking-tight">R</span>
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles
                  size={24}
                  className="text-orange-500 animate-pulse"
                  fill="currentColor"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif tracking-tight">
              Welcome to Rebraze
            </h1>
            <p className="text-gray-600">
              Your AI-powered workspace for intelligent collaboration
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Google login button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-full shadow-sm hover:shadow-lg hover:border-gray-300 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                <span className="font-semibold text-gray-700">Connecting...</span>
              </>
            ) : (
              <>
                <Chrome size={20} className="text-gray-700 group-hover:text-orange-500 transition-colors" />
                <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full"></div>
              </div>
              <span>AI-powered file analysis and insights</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full"></div>
              </div>
              <span>Collaborative workspace management</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full"></div>
              </div>
              <span>Secure cloud storage and sharing</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white drop-shadow-lg">
            Built by the Rebraze team
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
