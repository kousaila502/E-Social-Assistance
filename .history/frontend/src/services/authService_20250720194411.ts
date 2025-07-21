
import api, { AuthResponse, User } from './api';

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data interface
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword?: string;
}

// Password reset interfaces
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response: AuthResponse = await api.post('/auth/login', credentials);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Register user
  register: async (userData: RegisterData): Promise<any> => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Don't auto-login after registration, let user verify email first
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const response: AuthResponse = await api.post('/auth/refresh-token');
      
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      // If refresh fails, logout user
      authService.logout();
      throw error;
    }
  },

  // Verify email
  verifyEmail: async (token: string): Promise<any> => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<any> => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<any> => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  // Get current token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();
    return !!(token && user);
  },

  // Check if user has specific role
  hasRole: (role: User['role']): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === role;
  },

  // Check if user has any of the specified roles
  hasAnyRole: (roles: User['role'][]): boolean => {
    const user = authService.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
};

export default authService;