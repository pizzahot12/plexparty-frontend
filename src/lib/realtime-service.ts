/**
 * Room Realtime Service — powered by Supabase Realtime
 *
 * Replaces the hand-rolled WebSocket implementation with Supabase's
 * battle-tested Channels + Broadcast + Presence.
 *
 * Features:
 *  • Chat messages via Broadcast (instant, no DB round-trip for delivery)
 *  • Video sync (play/pause/seek) via Broadcast
 *  • Presence tracking (who is online)
 *  • Automatic reconnection handled by Supabase SDK
 *  • No duplicate-listener bugs (single channel subscription)
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoomEventType =
    | 'chat_message'
    | 'play'
    | 'pause'
    | 'seek'
    | 'user_kicked'
    | 'room_closed';

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

    // Callbacks — set once per join, cleared on leave
    private onChatMessage: EventCallback<ChatPayload> | null = null;
    private onPlay: EventCallback<VideoSyncPayload> | null = null;
    private onPause: EventCallback<VideoSyncPayload> | null = null;
    private onSeek: EventCallback<VideoSyncPayload> | null = null;
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
            onUserKicked: EventCallback<{ userId: string }>;
            onRoomClosed: EventCallback;
            onPresenceSync: EventCallback<PresenceState[]>;
        }
    ): void {
        // If already in a room, leave first
        if (this.channel) {
            this.leave();
        }

        this.roomId = roomId;

        // Store callbacks
        this.onChatMessage = callbacks.onChatMessage;
        this.onPlay = callbacks.onPlay;
        this.onPause = callbacks.onPause;
        this.onSeek = callbacks.onSeek;
        this.onUserKicked = callbacks.onUserKicked;
        this.onRoomClosed = callbacks.onRoomClosed;
        this.onPresenceSync = callbacks.onPresenceSync;

        // Create a Supabase Realtime channel for this room
        this.channel = supabase.channel(`room:${roomId}`, {
            config: { presence: { key: userInfo.id } },
        });

        // ── Broadcast listeners ─────────────────────────────────────────────

        this.channel
            .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
                this.onChatMessage?.(payload as ChatPayload);
            })
            .on('broadcast', { event: 'play' }, ({ payload }) => {
                // Don't echo back to sender
                const user = useAuthStore.getState().user;
                if (payload.triggeredBy !== user?.id) {
                    this.onPlay?.(payload as VideoSyncPayload);
                }
            })
            .on('broadcast', { event: 'pause' }, ({ payload }) => {
                const user = useAuthStore.getState().user;
                if (payload.triggeredBy !== user?.id) {
                    this.onPause?.(payload as VideoSyncPayload);
                }
            })
            .on('broadcast', { event: 'seek' }, ({ payload }) => {
                const user = useAuthStore.getState().user;
                if (payload.triggeredBy !== user?.id) {
                    this.onSeek?.(payload as VideoSyncPayload);
                }
            })
            .on('broadcast', { event: 'user_kicked' }, ({ payload }) => {
                this.onUserKicked?.(payload as { userId: string });
            })
            .on('broadcast', { event: 'room_closed' }, () => {
                this.onRoomClosed?.({});
            });

        // ── Presence listener ───────────────────────────────────────────────

        this.channel.on('presence', { event: 'sync' }, () => {
            const state = this.channel!.presenceState<PresenceState>();
            // Flatten: each key maps to an array of presences, take the first
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
        this.onUserKicked = null;
        this.onRoomClosed = null;
        this.onPresenceSync = null;
    }

    // ── Public: send chat message ───────────────────────────────────────────

    sendChatMessage(text: string): void {
        const user = useAuthStore.getState().user;
        if (!this.channel || !user) return;

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

        // Also save to DB for history (fire & forget)
        this._persistMessage(payload);
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

    // ── Public: admin commands ──────────────────────────────────────────────

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

    // ── Private: persist message to DB ──────────────────────────────────────

    private async _persistMessage(msg: ChatPayload): Promise<void> {
        if (!this.roomId) return;
        try {
            await supabase.from('room_messages').insert({
                room_id: this.roomId,
                user_id: msg.userId,
                text: msg.text,
            });
        } catch {
            // Non-critical — message was already broadcast in real-time
        }
    }
}

export const realtimeRoomService = new RealtimeRoomService();
export default realtimeRoomService;
