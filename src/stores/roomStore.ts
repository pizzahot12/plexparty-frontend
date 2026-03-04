import { create } from 'zustand';
import type { Room, Participant, VideoState, VideoQuality } from '@/types';
import { apiService } from '@/lib/api-service';
import { webSocketService } from '@/lib/websocket-service';
import { useAuthStore } from '@/stores/authStore';

interface RoomState {
  room: Room | null;
  isHost: boolean;
  videoState: VideoState;
  messages: { id: string; userId: string; userName: string; text: string; timestamp: string; userAvatar?: string }[];
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
  addMessage: (message: { userId: string; userName: string; text: string; userAvatar?: string }) => void;
  sendChatMessage: (text: string) => void;
  clearMessages: () => void;

  // Connection actions
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // WebSocket actions
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
        participants: [],
        createdAt: new Date().toISOString(),
        isPrivate,
      };

      set({
        room,
        isHost: true,
        isLoading: false,
        messages: [],
      });

      // Connect WebSocket
      await get().connectWebSocket(result.roomId);

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

      // Connect WebSocket
      await get().connectWebSocket(result.roomId);

      return true;
    } catch (error) {
      set({ isLoading: false, error: 'Error al unirse a la sala' });
      return false;
    }
  },

  leaveRoom: () => {
    get().disconnectWebSocket();
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
    const { isHost, room } = get();
    if (!isHost || !room) return false;

    try {
      await apiService.kickUser(room.id, userId);
      get().removeParticipant(userId);
      return true;
    } catch (error) {
      console.error('Error kicking participant:', error);
      return false;
    }
  },

  setVideoPlaying: (isPlaying) => {
    set((state) => ({
      videoState: { ...state.videoState, isPlaying },
    }));
    // Sync with WebSocket
    if (isPlaying) {
      webSocketService.play(get().videoState.currentTime);
    } else {
      webSocketService.pause(get().videoState.currentTime);
    }
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
      } catch (e) {
        // Ignore auto-play errors
      }
    }

    const newMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  sendChatMessage: (text) => {
    if (!text.trim()) return;
    webSocketService.sendMessage(text.trim());
  },

  clearMessages: () => set({ messages: [] }),

  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  connectWebSocket: async (roomId) => {
    try {
      webSocketService.clearHandlers();
      await webSocketService.connect(roomId);
      set({ isConnected: true });

      // Subscribe to WebSocket events
      webSocketService.on('connection_established', () => {
        set({ isConnected: true });
      });

      webSocketService.on('user_joined', () => {
        // Refresh ONLY participant list via API (do NOT call joinRoom() — that would open another WS, causing an infinite loop)
        const code = get().room?.code;
        if (code) {
          apiService.getRoomByCode(code).then((result) => {
            const participants = [
              { ...result.host, isHost: true, isOnline: result.host.isOnline ?? true, isWatching: result.host.isWatching },
              ...result.participants.map((p) => ({ ...p, isHost: false, isOnline: p.isOnline ?? true, isWatching: p.isWatching })),
            ];
            set((state) => ({
              room: state.room ? { ...state.room, participants } : state.room,
            }));
          }).catch(() => { });
        }
      });

      webSocketService.on('user_left', (event) => {
        const userId = event.userId as string;
        get().updateParticipant(userId, { isOnline: false });
      });

      webSocketService.on('play', (event) => {
        set((state) => ({
          videoState: { ...state.videoState, isPlaying: true, currentTime: (event.currentTime as number) || state.videoState.currentTime },
        }));
      });

      webSocketService.on('pause', (event) => {
        set((state) => ({
          videoState: { ...state.videoState, isPlaying: false, currentTime: (event.currentTime as number) || state.videoState.currentTime },
        }));
      });

      webSocketService.on('seek', (event) => {
        set((state) => ({
          videoState: { ...state.videoState, currentTime: (event.currentTime as number) || state.videoState.currentTime },
        }));
      });

      webSocketService.on('chat_message', (event) => {
        const msg = event as unknown as { userId: string; userName: string; text: string; userAvatar?: string };
        get().addMessage({
          userId: msg.userId,
          userName: msg.userName,
          text: msg.text,
          userAvatar: msg.userAvatar,
        });
      });

      webSocketService.on('user_kicked', (event) => {
        const currentUser = useAuthStore.getState().user;
        const kickedUserId = event.userId as string;
        if (currentUser?.id === kickedUserId) {
          // Current user was kicked
          get().leaveRoom();
        } else {
          get().removeParticipant(kickedUserId);
        }
      });

      webSocketService.on('room_closed', () => {
        get().leaveRoom();
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      set({ isConnected: false, error: 'Error de conexión en tiempo real' });
    }
  },

  disconnectWebSocket: () => {
    webSocketService.disconnect();
    set({ isConnected: false });
  },
}));
