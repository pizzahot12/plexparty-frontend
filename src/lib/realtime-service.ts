/**
 * Room Realtime Service — powered by Supabase Realtime
 *
 * Uses Supabase Channels + Broadcast + Presence for:
 *  • Chat messages (instant broadcast, no DB round-trip)
 *  • Video sync (play/pause/seek + heartbeat)
 *  • Presence tracking (who is online)
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatPayload {
    userId: string;
    userName: string;
    text: string;
    userAvatar?: string;
    timestamp: string;
}

export interface VideoSyncPayload {
    currentTime: number;
    triggeredBy: string;
}

export interface HeartbeatPayload {
    currentTime: number;
    isPlaying: boolean;
    hostId: string;
}

export interface PresenceState {
    id: string;
    name: string;
    avatar?: string;
    isHost: boolean;
    online_at: string;
}

type EventCallback<T = Record<string, unknown>> = (payload: T) => void;

// ─── Service ──────────────────────────────────────────────────────────────────

class RealtimeRoomService {
    private channel: RealtimeChannel | null = null;
    private roomId: string | null = null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    // Callbacks
    private onChatMessage: EventCallback<ChatPayload> | null = null;
    private onPlay: EventCallback<VideoSyncPayload> | null = null;
    private onPause: EventCallback<VideoSyncPayload> | null = null;
    private onSeek: EventCallback<VideoSyncPayload> | null = null;
    private onHeartbeat: EventCallback<HeartbeatPayload> | null = null;
    private onUserKicked: EventCallback<{ userId: string }> | null = null;
    private onRoomClosed: EventCallback | null = null;
    private onPresenceSync: EventCallback<PresenceState[]> | null = null;

    // ── Public: join a room ─────────────────────────────────────────────────

    join(
        roomId: string,
        userInfo: { id: string; name: string; avatar?: string; isHost: boolean },
        callbacks: {
            onChatMessage: EventCallback<ChatPayload>;
            onPlay: EventCallback<VideoSyncPayload>;
            onPause: EventCallback<VideoSyncPayload>;
            onSeek: EventCallback<VideoSyncPayload>;
            onHeartbeat: EventCallback<HeartbeatPayload>;
            onUserKicked: EventCallback<{ userId: string }>;
            onRoomClosed: EventCallback;
            onPresenceSync: EventCallback<PresenceState[]>;
        }
    ): void {
        if (this.channel) {
            this.leave();
        }

        this.roomId = roomId;

        this.onChatMessage = callbacks.onChatMessage;
        this.onPlay = callbacks.onPlay;
        this.onPause = callbacks.onPause;
        this.onSeek = callbacks.onSeek;
        this.onHeartbeat = callbacks.onHeartbeat;
        this.onUserKicked = callbacks.onUserKicked;
        this.onRoomClosed = callbacks.onRoomClosed;
        this.onPresenceSync = callbacks.onPresenceSync;

        this.channel = supabase.channel(`room:${roomId}`, {
            config: { presence: { key: userInfo.id } },
        });

        const myId = userInfo.id;

        // ── Broadcast listeners ─────────────────────────────────────────────

        this.channel
            .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
                // Skip own messages (we add them locally in sendChatMessage)
                if (payload.userId === myId) return;
                this.onChatMessage?.(payload as ChatPayload);
            })
            .on('broadcast', { event: 'play' }, ({ payload }) => {
                if (payload.triggeredBy === myId) return;
                this.onPlay?.(payload as VideoSyncPayload);
            })
            .on('broadcast', { event: 'pause' }, ({ payload }) => {
                if (payload.triggeredBy === myId) return;
                this.onPause?.(payload as VideoSyncPayload);
            })
            .on('broadcast', { event: 'seek' }, ({ payload }) => {
                if (payload.triggeredBy === myId) return;
                this.onSeek?.(payload as VideoSyncPayload);
            })
            .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
                if (payload.hostId === myId) return;
                this.onHeartbeat?.(payload as HeartbeatPayload);
            })
            .on('broadcast', { event: 'user_kicked' }, ({ payload }) => {
                this.onUserKicked?.(payload as { userId: string });
            })
            .on('broadcast', { event: 'room_closed' }, () => {
                this.onRoomClosed?.({});
            })
            .on('broadcast', { event: 'reaction' }, ({ payload }) => {
                // Dispatch a global CustomEvent so FloatingReactions can pick it up
                window.dispatchEvent(new CustomEvent('remote_reaction', { detail: { emoji: payload.emoji } }));
            });

        // ── Presence listener ───────────────────────────────────────────────

        this.channel.on('presence', { event: 'sync' }, () => {
            const state = this.channel!.presenceState<PresenceState>();
            const users: PresenceState[] = Object.values(state).map((arr) => arr[0]);
            this.onPresenceSync?.(users);
        });

        // ── Subscribe and track presence ────────────────────────────────────

        this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await this.channel!.track({
                    id: userInfo.id,
                    name: userInfo.name,
                    avatar: userInfo.avatar || '',
                    isHost: userInfo.isHost,
                    online_at: new Date().toISOString(),
                });
                console.log(`[RealtimeRoom] Joined room ${roomId} as ${userInfo.name}`);
            }
        });
    }

    // ── Public: leave the room ──────────────────────────────────────────────

    leave(): void {
        this.stopHeartbeat();
        if (this.channel) {
            this.channel.untrack();
            supabase.removeChannel(this.channel);
            this.channel = null;
            console.log(`[RealtimeRoom] Left room ${this.roomId}`);
        }
        this.roomId = null;
        this.onChatMessage = null;
        this.onPlay = null;
        this.onPause = null;
        this.onSeek = null;
        this.onHeartbeat = null;
        this.onUserKicked = null;
        this.onRoomClosed = null;
        this.onPresenceSync = null;
    }

    // ── Public: send chat message ───────────────────────────────────────────
    // Returns the payload so the caller can add it locally (optimistic update)

    sendChatMessage(text: string): ChatPayload | null {
        const user = useAuthStore.getState().user;
        if (!this.channel || !user) return null;

        const payload: ChatPayload = {
            userId: user.id,
            userName: user.name || user.email || 'Anon',
            text,
            userAvatar: user.avatar,
            timestamp: new Date().toISOString(),
        };

        this.channel.send({
            type: 'broadcast',
            event: 'chat_message',
            payload,
        });

        return payload;
    }

    // ── Public: video sync commands ─────────────────────────────────────────

    sendPlay(currentTime: number): void {
        const user = useAuthStore.getState().user;
        if (!this.channel || !user) return;
        this.channel.send({
            type: 'broadcast',
            event: 'play',
            payload: { currentTime, triggeredBy: user.id } as VideoSyncPayload,
        });
    }

    sendPause(currentTime: number): void {
        const user = useAuthStore.getState().user;
        if (!this.channel || !user) return;
        this.channel.send({
            type: 'broadcast',
            event: 'pause',
            payload: { currentTime, triggeredBy: user.id } as VideoSyncPayload,
        });
    }

    sendSeek(currentTime: number): void {
        const user = useAuthStore.getState().user;
        if (!this.channel || !user) return;
        this.channel.send({
            type: 'broadcast',
            event: 'seek',
            payload: { currentTime, triggeredBy: user.id } as VideoSyncPayload,
        });
    }

    // ── Public: heartbeat (host broadcasts position every 2s) ─────────────

    startHeartbeat(getState: () => { currentTime: number; isPlaying: boolean }): void {
        this.stopHeartbeat();
        const user = useAuthStore.getState().user;
        if (!user) return;

        this.heartbeatTimer = setInterval(() => {
            if (!this.channel) return;
            const state = getState();
            this.channel.send({
                type: 'broadcast',
                event: 'heartbeat',
                payload: {
                    currentTime: state.currentTime,
                    isPlaying: state.isPlaying,
                    hostId: user.id,
                } as HeartbeatPayload,
            });
        }, 2000);
    }

    stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // ── Public: admin commands ──────────────────────────────────────────────

    sendReaction(emoji: string): void {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'reaction',
            payload: { emoji },
        });
    }

    sendKickUser(userId: string): void {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'user_kicked',
            payload: { userId },
        });
    }

    sendRoomClosed(): void {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'room_closed',
            payload: {},
        });
    }

    // ── Public: status ──────────────────────────────────────────────────────

    isJoined(): boolean {
        return this.channel !== null;
    }
}

export const realtimeRoomService = new RealtimeRoomService();
export default realtimeRoomService;
