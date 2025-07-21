// src/hooks/useAuth.ts
import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

// Re-export the useAuth hook from context for better organization
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Additional auth-related hooks for specific use cases

// Hook to check if user is admin
export const useIsAdmin = (): boolean => {
  const { hasRole } = useAuth();
  return hasRole('admin');
};

// Hook to check if user is case worker
export const useIsCaseWorker = (): boolean => {
  const { hasRole } = useAuth();
  return hasRole('case_worker');
};

// Hook to check if user is finance manager
export const useIsFinanceManager = (): boolean => {
  const { hasRole } = useAuth();
  return hasRole('finance_manager');
};

// Hook to check if user is regular user
export const useIsUser = (): boolean => {
  const { hasRole } = useAuth();
  return hasRole('user');
};

// Hook to check if user has staff privileges (admin, case_worker, finance_manager)
export const useIsStaff = (): boolean => {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(['admin', 'case_worker', 'finance_manager']);
};

// Hook to get user's full name
export const useUserFullName = (): string => {
  const { user } = useAuth();
  return user ? `${user.firstName} ${user.lastName}` : '';
};

// Hook to get user's initials
export const useUserInitials = (): string => {
  const { user } = useAuth();
  if (!user) return '';
  
  const firstInitial = user.firstName?.charAt(0).toUpperCase() || '';
  const lastInitial = user.lastName?.charAt(0).toUpperCase() || '';
  
  return `${firstInitial}${lastInitial}`;
};

export default useAuth;