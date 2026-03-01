import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    setUser,
    updateUser,
    initSession,
    updateProfile,
  } = useAuthStore();

  const checkAuth = useCallback(() => {
    return isAuthenticated && !!token;
  }, [isAuthenticated, token]);

  const getAuthHeaders = useCallback(() => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    setUser,
    updateUser,
    checkAuth,
    getAuthHeaders,
    initSession,
    updateProfile,
  };
};
