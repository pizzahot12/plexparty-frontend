import { useCallback } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationType } from '@/types';

export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getUnreadNotifications,
    getNotificationsByType,
  } = useNotificationStore();

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    extraData?: {
      userId?: string;
      userName?: string;
      userAvatar?: string;
      roomCode?: string;
      mediaTitle?: string;
    }
  ) => {
    return addNotification({
      type,
      title,
      message,
      ...extraData,
    });
  }, [addNotification]);

  const showSuccess = useCallback((title: string, message: string) => {
    return showNotification('success', title, message);
  }, [showNotification]);

  const showError = useCallback((title: string, message: string) => {
    return showNotification('error', title, message);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    return showNotification('warning', title, message);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    return showNotification('info', title, message);
  }, [showNotification]);

  const showInvite = useCallback((
    userName: string,
    mediaTitle: string,
    roomCode: string,
    userAvatar?: string,
    userId?: string
  ) => {
    return showNotification(
      'invite',
      'Invitación a sala',
      `${userName} te invita a ver ${mediaTitle}`,
      { userId, userName, userAvatar, roomCode, mediaTitle }
    );
  }, [showNotification]);

  const dismissNotification = useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  const dismissAll = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    unreadNotifications: getUnreadNotifications(),
    
    // Actions
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showInvite,
    dismissNotification,
    dismissAll,
    markAsRead,
    markAllAsRead,
    getNotificationsByType,
  };
};
