/**
 * Global Presence Service — powered by Supabase Realtime Presence
 *
 * Tracks which users are online and what they're watching.
 * Any authenticated user joins channel "app:presence" on login.
 * Friends query this channel to see who is online.
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface UserPresence {
    id: string;
    name: string;
    avatar?: string;
    online_at: string;
    watching?: string;     // media title if watching
    roomCode?: string;     // room code if in a room
}

type PresenceCallback = (onlineUsers: UserPresence[]) => void;

class GlobalPresenceService {
    private channel: RealtimeChannel | null = null;
    private onSync: PresenceCallback | null = null;
    private currentWatching: string | undefined = undefined;
    private currentRoomCode: string | undefined = undefined;

    /**
     * Start tracking this user's presence globally.
     * Call once on app load after authentication.
     */
    start(callback?: PresenceCallback): void {
        if (this.channel) return; // already tracking

        const user = useAuthStore.getState().user;
        if (!user) return;

        this.onSync = callback || null;

        this.channel = supabase.channel('app:presence', {
            config: { presence: { key: user.id } },
        });

        this.channel.on('presence', { event: 'sync' }, () => {
            if (!this.onSync) return;
            const state = this.channel!.presenceState<UserPresence>();
            const users: UserPresence[] = Object.values(state).map((arr: any) => arr[0]);
            this.onSync(users);
        });

        this.channel.subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
                await this.channel!.track({
                    id: user.id,
                    name: user.name || user.email || 'Anon',
                    avatar: user.avatar || '',
                    online_at: new Date().toISOString(),
                    watching: this.currentWatching,
                    roomCode: this.currentRoomCode,
                } as UserPresence);
                console.log('[GlobalPresence] Tracking started for', user.name);
            }
        });
    }

    /**
     * Update watching status (call when entering/leaving a room).
     */
    async setWatching(mediaTitle?: string, roomCode?: string): Promise<void> {
        this.currentWatching = mediaTitle;
        this.currentRoomCode = roomCode;

        if (!this.channel) return;
        const user = useAuthStore.getState().user;
        if (!user) return;

        await this.channel.track({
            id: user.id,
            name: user.name || user.email || 'Anon',
            avatar: user.avatar || '',
            online_at: new Date().toISOString(),
            watching: mediaTitle,
            roomCode,
        } as UserPresence);
    }

    /**
     * Set a callback to be notified when the presence state changes.
     */
    onPresenceSync(callback: PresenceCallback): void {
        this.onSync = callback;
    }

    /**
     * Get current snapshot of online users.
     */
    getOnlineUsers(): UserPresence[] {
        if (!this.channel) return [];
        const state = this.channel.presenceState<UserPresence>();
        return Object.values(state).map((arr: any) => arr[0]);
    }

    /**
     * Stop tracking (call on logout).
     */
    stop(): void {
        if (this.channel) {
            this.channel.untrack();
            supabase.removeChannel(this.channel);
            this.channel = null;
            console.log('[GlobalPresence] Tracking stopped');
        }
        this.onSync = null;
        this.currentWatching = undefined;
        this.currentRoomCode = undefined;
    }
}

export const globalPresenceService = new GlobalPresenceService();
export default globalPresenceService;
