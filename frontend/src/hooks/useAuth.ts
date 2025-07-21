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

// Hook to get user's display name (based on your User schema)
export const useUserDisplayName = (): string => {
  const { user } = useAuth();
  return user?.name || '';
};

// Hook to get user's initials (from the name field)
export const useUserInitials = (): string => {
  const { user } = useAuth();
  if (!user?.name) return '';
  
  const nameParts = user.name.trim().split(' ');
  const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || '';
  const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() : '';
  
  return `${firstInitial}${lastInitial}`;
};

// Hook to check if user's email is verified
export const useIsEmailVerified = (): boolean => {
  const { user } = useAuth();
  return user?.isEmailVerified || false;
};

// Hook to get user's account status
export const useAccountStatus = (): string => {
  const { user } = useAuth();
  return user?.accountStatus || 'unknown';
};

// Hook to check if user account is active
export const useIsAccountActive = (): boolean => {
  const { user } = useAuth();
  return user?.accountStatus === 'active';
};

// Hook to get user's eligibility status
export const useEligibilityStatus = (): string => {
  const { user } = useAuth();
  return user?.eligibility?.status || 'pending';
};

// Hook to get user's eligibility score
export const useEligibilityScore = (): number => {
  const { user } = useAuth();
  return user?.eligibility?.score || 0;
};

export default useAuth;