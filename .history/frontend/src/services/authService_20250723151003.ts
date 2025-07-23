// src/services/authService.ts
import api, { API_CONFIG, AuthResponse, User } from '../config/apiConfig';

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  phoneNumber: string;
  personalInfo?: {
    nationalId?: string;
    dateOfBirth?: string;
  };
  economicInfo?: {
    familySize?: number;
    monthlyIncome?: number;
    employmentStatus?: 'employed' | 'unemployed' | 'self_employed' | 'retired' | 'student' | 'disabled';
  };
}

export interface AuthServiceResponse extends AuthResponse {
  token?: string;
}

const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthServiceResponse> => {
    try {
      const response: AuthResponse = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);

      // For cookie-based auth, we might not get a token in response
      // But we can extract it from cookies or use the user data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        // If backend sends token in response, store it
        if ('token' in response) {
          localStorage.setItem('token', (response as any).token);
        }
      }

      return response as AuthServiceResponse;
    } catch (error: any) {
      throw error;
    }
  },

  // Register user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response: AuthResponse = await api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);

      // Don't auto-login after registration, let user verify email first
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Get current user profile from server
  getCurrentUserProfile: async (): Promise<User> => {
    try {
      const response: { user: User } = await api.get(API_CONFIG.ENDPOINTS.AUTH.ME);
      return response.user;
    } catch (error: any) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    try {
      const response: { user: User } = await api.patch(API_CONFIG.ENDPOINTS.AUTH.PROFILE, profileData);

      // Update localStorage with new user data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response.user;
    } catch (error: any) {
      throw error;
    }
  },

  // Verify email
  verifyEmail: async (token: string, email: string): Promise<any> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
        token,
        email
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<any> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION, {
        email
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<any> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token: string, email: string, password: string, confirmPassword: string): Promise<any> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        email,
        password,
        confirmPassword
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Change password (for authenticated users)
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<any> => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('User from localStorage:', user); // DEBUG
        return user;
      }
      return null;
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
    const user = authService.getCurrentUser();
    // For cookie-based auth, we primarily check for user data
    // Token might not always be present in localStorage
    return !!user;
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
  },

  // Clear all auth data
  clearAuthData: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService;