import React from 'react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';
import { X, Check, AlertCircle, Info, UserPlus, CheckCircle } from 'lucide-react';

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: AlertCircle,
  invite: UserPlus,
};

const colorMap = {
  info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  success: 'bg-green-500/20 border-green-500/30 text-green-400',
  warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  error: 'bg-red-500/20 border-red-500/30 text-red-400',
  invite: 'bg-[#ff6b35]/20 border-[#ff6b35]/30 text-[#ff6b35]',
};

export const NotificationContainer: React.FC = () => {
  const { notifications, dismissNotification, markAsRead } = useNotificationStore();
  useSupabaseNotifications();

  const visibleNotifications = notifications.filter(n => !n.dismissed);

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => dismissNotification(notification.id)}
          onAction={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: {
    id: string;
    type: keyof typeof iconMap;
    title: string;
    message: string;
    userAvatar?: string;
    roomCode?: string;
    read: boolean;
  };
  onClose: () => void;
  onAction: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
  onAction,
}) => {
  const Icon = iconMap[notification.type];
  const colors = colorMap[notification.type];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border backdrop-blur-md shadow-lg',
        'transform transition-all duration-300 animate-in slide-in-from-right',
        colors,
        notification.read && 'opacity-70'
      )}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon or Avatar */}
        {notification.userAvatar ? (
          <img
            src={notification.userAvatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10')}>
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">{notification.title}</p>
          <p className="text-white/70 text-sm mt-0.5">{notification.message}</p>

          {/* Actions for invites */}
          {notification.type === 'invite' && notification.roomCode && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  onAction();
                  // Navigate to room would go here
                }}
                className="flex-1 py-1.5 px-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aceptar
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white/70 text-sm font-medium rounded-lg transition-colors"
              >
                Ignorar
              </button>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
