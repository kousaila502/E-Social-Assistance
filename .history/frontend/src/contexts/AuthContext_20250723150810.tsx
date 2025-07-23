// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import authService, { LoginCredentials, RegisterData } from '../services/authService';
import { User } from '../config/apiConfig';

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER: 'LOAD_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  UPDATE_USER: 'UPDATE_USER'
} as const;

// Action interfaces
type AuthAction =
  | { type: typeof AUTH_ACTIONS.LOGIN_START }
  | { type: typeof AUTH_ACTIONS.LOGIN_SUCCESS; payload: { user: User; token?: string } }
  | { type: typeof AUTH_ACTIONS.LOGIN_FAILURE; payload: string }
  | { type: typeof AUTH_ACTIONS.LOGOUT }
  | { type: typeof AUTH_ACTIONS.REGISTER_START }
  | { type: typeof AUTH_ACTIONS.REGISTER_SUCCESS }
  | { type: typeof AUTH_ACTIONS.REGISTER_FAILURE; payload: string }
  | { type: typeof AUTH_ACTIONS.LOAD_USER; payload: { user: User | null; token: string | null } }
  | { type: typeof AUTH_ACTIONS.CLEAR_ERROR }
  | { type: typeof AUTH_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof AUTH_ACTIONS.UPDATE_USER; payload: User };

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token || null,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!(action.payload.user),
        isLoading: false
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    default:
      return state;
  }
};

// Context interface
interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<any>;
  register: (userData: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;

  // Role-based helpers
  hasRole: (role: User['role']) => boolean;
  hasAnyRole: (roles: User['role'][]) => boolean;
  isAdmin: () => boolean;
  isCaseWorker: () => boolean;
  isFinanceManager: () => boolean;
  isRegularUser: () => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = authService.getToken();
        const user = authService.getCurrentUser();
        
        // DEBUG: Log what we get from localStorage
        console.log('Loaded user from localStorage:', user);
        
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: { user, token }
        });
      } catch (error) {
        console.error('Error loading user:', error);
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: { user: null, token: null }
        });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authService.login(credentials);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          token: response.token
        }
      });

      return response;
    } catch (error: any) {
      console.error('Login error details:', error);

      // Don't modify the error, just pass it through
      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        'Login failed';

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      // Re-throw the original error so LoginForm can handle it properly
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: RegisterData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await authService.register(userData);

      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS });

      return response;
    } catch (error: any) {
      const errorMessage = error?.message || error?.data?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser
      });
    } catch (error: any) {
      throw error;
    }
  }, []);

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUserProfile();
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: user
      });
    } catch (error: any) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Role-based helper functions
  const hasRole = useCallback((role: User['role']): boolean => {
    return state.user?.role === role;
  }, [state.user?.role]);

  const hasAnyRole = useCallback((roles: User['role'][]): boolean => {
    return state.user ? roles.includes(state.user.role) : false;
  }, [state.user?.role]);

  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const isCaseWorker = useCallback((): boolean => {
    return hasRole('case_worker');
  }, [hasRole]);

  const isFinanceManager = useCallback((): boolean => {
    return hasRole('finance_manager');
  }, [hasRole]);

  const isRegularUser = useCallback((): boolean => {
    return hasRole('user');
  }, [hasRole]);

  const value: AuthContextType = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    clearError,
    updateUserProfile,
    refreshUser,

    // Role helpers
    hasRole,
    hasAnyRole,
    isAdmin,
    isCaseWorker,
    isFinanceManager,
    isRegularUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;