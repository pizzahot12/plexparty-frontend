import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useFriendChatStore } from '@/stores/friendChatStore';
import type { NotificationType } from '@/types';

export function useSupabaseNotifications() {
    const user = useAuthStore((s) => s.user);
    const addNotification = useNotificationStore((s) => s.addNotification);
    const receiveInvite = useFriendChatStore((s) => s.receiveInvite);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications_db_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotif = payload.new;
                    if (!newNotif) return;

                    // Process the incoming notification based on its type
                    const type = newNotif.type as NotificationType;
                    const data = typeof newNotif.data === 'string' ? JSON.parse(newNotif.data) : newNotif.data || {};

                    // In case it's an invite, also push it to FriendChatStore to show mock messages
                    if (type === 'invite' && data.fromUserId) {
                        receiveInvite(data.fromUserId, data.roomCode);
                    }

                    addNotification({
                        type,
                        title: data.title || type,
                        message: data.message || '',
                        userId: data.fromUserId,
                        userName: data.userName,
                        userAvatar: data.userAvatar,
                        roomCode: data.roomCode,
                        mediaTitle: data.mediaTitle,
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, addNotification, receiveInvite]);
}
