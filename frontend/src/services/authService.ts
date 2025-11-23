// Use relative URLs in development - Vite will proxy to localhost:8000
// In production, set this to your actual API URL
const API_BASE_URL = import.meta.env.PROD ? 'http://localhost:8000' : '';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface AuthUrlResponse {
  url: string;
  csrf_token: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Get the Google OAuth authorization URL
   */
  async getGoogleAuthUrl(): Promise<AuthUrlResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Auth URL error response:', errorText);
        throw new Error(`Failed to get Google auth URL: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to connect to auth service:', error);
      throw error;
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<UserProfile> {
    if (!this.token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, clear it
        this.logout();
        throw new Error('Authentication token is invalid');
      }
      throw new Error('Failed to get current user');
    }

    return response.json();
  }

  /**
   * Logout the user
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clear local state
      this.token = null;
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Set the authentication token
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Get the current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

export const authService = new AuthService();
