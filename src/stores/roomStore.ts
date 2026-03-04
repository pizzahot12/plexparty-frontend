import { create } from 'zustand';
import type { Room, Participant, VideoState, VideoQuality } from '@/types';
import { apiService } from '@/lib/api-service';
import { realtimeRoomService } from '@/lib/realtime-service';
import type { PresenceState } from '@/lib/realtime-service';
import { useAuthStore } from '@/stores/authStore';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  userAvatar?: string;
}

interface RoomState {
  room: Room | null;
  isHost: boolean;
  videoState: VideoState;
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface RoomStore extends RoomState {
  // Room actions
  setRoom: (room: Room | null) => void;
  createRoom: (mediaId: string, mediaTitle: string, mediaPoster?: string, isPrivate?: boolean) => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  setIsHost: (isHost: boolean) => void;

  // Participant actions
  addParticipant: (participant: Participant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, updates: Partial<Participant>) => void;
  kickParticipant: (userId: string) => Promise<boolean>;

  // Video state actions
  setVideoPlaying: (isPlaying: boolean) => void;
  setVideoTime: (currentTime: number) => void;
  setVideoDuration: (duration: number) => void;
  setVideoVolume: (volume: number) => void;
  setVideoQuality: (quality: VideoQuality) => void;
  setVideoPlaybackRate: (rate: number) => void;
  syncVideoState: (state: Partial<VideoState>) => void;

  // Chat actions
  addMessage: (message: { userId: string; userName: string; text: string; userAvatar?: string; timestamp?: string }) => void;
  sendChatMessage: (text: string) => void;
  clearMessages: () => void;

  // Connection actions
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Realtime actions (replaces old WebSocket)
  connectToRoom: (roomId: string) => void;
  disconnectFromRoom: () => void;

  // Keep old names as aliases for compatibility
  connectWebSocket: (roomId: string) => Promise<void>;
  disconnectWebSocket: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: null,
  isHost: false,
  videoState: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    quality: 'auto',
    playbackRate: 1,
  },
  messages: [],
  isConnected: false,
  isLoading: false,
  error: null,

  setRoom: (room) => set({ room }),

  createRoom: async (mediaId, mediaTitle, mediaPoster, isPrivate = true) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiService.createRoom(mediaId, mediaTitle, isPrivate);
      const currentUser = useAuthStore.getState().user;

      const room: Room = {
        id: result.roomId,
        code: result.code,
        mediaId,
        mediaTitle,
        mediaPoster,
        hostId: currentUser?.id || '',
        participants: currentUser ? [{
          id: currentUser.id,
          name: currentUser.name || currentUser.email || 'Host',
          avatar: currentUser.avatar,
          isHost: true,
          isOnline: true,
          isWatching: true,
        }] : [],
        createdAt: new Date().toISOString(),
        isPrivate,
      };

      set({
        room,
        isHost: true,
        isLoading: false,
        messages: [],
      });

      // Connect to Supabase Realtime channel
      get().connectToRoom(result.roomId);

      return result.code;
    } catch (error) {
      set({ isLoading: false, error: 'Error al crear la sala' });
      return null;
    }
  },

  joinRoom: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiService.getRoomByCode(code);
      const currentUser = useAuthStore.getState().user;

      const room: Room = {
        id: result.roomId,
        code: result.code,
        mediaId: result.mediaId,
        hostId: result.host.id,
        participants: [
          { ...result.host, isHost: true, isOnline: result.host.isOnline ?? true, isWatching: result.host.isWatching },
          ...result.participants.map((p) => ({ ...p, isHost: false, isOnline: p.isOnline ?? true, isWatching: p.isWatching })),
        ],
        createdAt: result.createdAt,
        isPrivate: true,
      };

      const isHost = result.host.id === currentUser?.id;

      set({
        room,
        isHost,
        isLoading: false,
        messages: [],
      });

      // Connect to Supabase Realtime channel
      get().connectToRoom(result.roomId);

      return true;
    } catch (error) {
      set({ isLoading: false, error: 'Error al unirse a la sala' });
      return false;
    }
  },

  leaveRoom: () => {
    get().disconnectFromRoom();
    set({
      room: null,
      isHost: false,
      isConnected: false,
      messages: [],
      videoState: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        quality: 'auto',
        playbackRate: 1,
      },
    });
  },

  setIsHost: (isHost) => set({ isHost }),

  addParticipant: (participant) => {
    set((state) => {
      if (!state.room) return state;
      const exists = state.room.participants.some((p) => p.id === participant.id);
      if (exists) return state;
      return {
        room: {
          ...state.room,
          participants: [...state.room.participants, participant],
        },
      };
    });
  },

  removeParticipant: (userId) => {
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          participants: state.room.participants.filter((p) => p.id !== userId),
        },
      };
    });
  },

  updateParticipant: (userId, updates) => {
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          participants: state.room.participants.map((p) =>
            p.id === userId ? { ...p, ...updates } : p
          ),
        },
      };
    });
  },

  kickParticipant: async (userId) => {
    const room = get().room;
    if (!room) return false;
    try {
      await apiService.kickUser(room.id, userId);
      realtimeRoomService.sendKickUser(userId);
      get().removeParticipant(userId);
      return true;
    } catch {
      return false;
    }
  },

  setVideoPlaying: (isPlaying) => {
    set((state) => ({
      videoState: { ...state.videoState, isPlaying },
    }));
  },

  setVideoTime: (currentTime) => {
    set((state) => ({
      videoState: { ...state.videoState, currentTime },
    }));
  },

  setVideoDuration: (duration) => {
    set((state) => ({
      videoState: { ...state.videoState, duration },
    }));
  },

  setVideoVolume: (volume) => {
    set((state) => ({
      videoState: { ...state.videoState, volume },
    }));
  },

  setVideoQuality: (quality) => {
    set((state) => ({
      videoState: { ...state.videoState, quality },
    }));
  },

  setVideoPlaybackRate: (playbackRate) => {
    set((state) => ({
      videoState: { ...state.videoState, playbackRate },
    }));
  },

  syncVideoState: (state) => {
    set((prev) => ({
      videoState: { ...prev.videoState, ...state },
    }));
  },

  addMessage: (message) => {
    const currentUser = useAuthStore.getState().user;

    // Notification sound for messages from others
    if (currentUser && message.userId !== currentUser.id) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
        }
      } catch {
        // Ignore auto-play errors
      }
    }

    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: message.timestamp || new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  sendChatMessage: (text) => {
    if (!text.trim()) return;
    realtimeRoomService.sendChatMessage(text.trim());
  },

  clearMessages: () => set({ messages: [] }),

  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // ── Supabase Realtime connection ───────────────────────────────────────

  connectToRoom: (roomId) => {
    const currentUser = useAuthStore.getState().user;
    const isHost = get().isHost;

    if (!currentUser) {
      console.error('[RoomStore] No user available for Realtime connection');
      return;
    }

    realtimeRoomService.join(
      roomId,
      {
        id: currentUser.id,
        name: currentUser.name || currentUser.email || 'Anon',
        avatar: currentUser.avatar,
        isHost,
      },
      {
        onChatMessage: (payload) => {
          get().addMessage({
            userId: payload.userId,
            userName: payload.userName,
            text: payload.text,
            userAvatar: payload.userAvatar,
            timestamp: payload.timestamp,
          } as any);
        },

        onPlay: (payload) => {
          set((state) => ({
            videoState: {
              ...state.videoState,
              isPlaying: true,
              currentTime: payload.currentTime || state.videoState.currentTime,
            },
          }));
        },

        onPause: (payload) => {
          set((state) => ({
            videoState: {
              ...state.videoState,
              isPlaying: false,
              currentTime: payload.currentTime || state.videoState.currentTime,
            },
          }));
        },

        onSeek: (payload) => {
          set((state) => ({
            videoState: {
              ...state.videoState,
              currentTime: payload.currentTime || state.videoState.currentTime,
            },
          }));
        },

        onUserKicked: ({ userId }) => {
          const currentUser = useAuthStore.getState().user;
          if (currentUser?.id === userId) {
            get().leaveRoom();
          } else {
            get().removeParticipant(userId);
          }
        },

        onRoomClosed: () => {
          get().leaveRoom();
        },

        onPresenceSync: (users: PresenceState[]) => {
          const room = get().room;
          if (!room) return;

          // Update participants based on who is actually present
          const updatedParticipants: Participant[] = users.map((u) => ({
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            isHost: u.isHost || u.id === room.hostId,
            isOnline: true,
            isWatching: true,
          }));

          set((state) => ({
            room: state.room ? { ...state.room, participants: updatedParticipants } : state.room,
          }));
        },
      }
    );

    set({ isConnected: true });
  },

  disconnectFromRoom: () => {
    realtimeRoomService.leave();
    set({ isConnected: false });
  },

  // Aliases for backward compatibility with WatchPage, VideoPlayer, etc.
  connectWebSocket: async (roomId) => {
    get().connectToRoom(roomId);
  },

  disconnectWebSocket: () => {
    get().disconnectFromRoom();
  },
}));
