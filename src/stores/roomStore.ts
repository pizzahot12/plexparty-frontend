import { create } from 'zustand';
import type { Room, Participant, VideoState, VideoQuality } from '@/types';

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
  createRoom: (mediaId: string, mediaTitle: string, mediaPoster?: string) => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  setIsHost: (isHost: boolean) => void;
  
  // Participant actions
  addParticipant: (participant: Participant) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, updates: Partial<Participant>) => void;
  kickParticipant: (userId: string) => void;
  
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
  clearMessages: () => void;
  
  // Connection actions
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Mock room creation
const mockCreateRoom = async (mediaId: string, mediaTitle: string, mediaPoster?: string): Promise<Room> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return {
    id: `room-${Date.now()}`,
    code,
    mediaId,
    mediaTitle,
    mediaPoster,
    hostId: 'current-user',
    participants: [],
    createdAt: new Date().toISOString(),
    isPrivate: true,
  };
};

// Mock join room
const mockJoinRoom = async (code: string): Promise<Room | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (code.length === 6) {
    return {
      id: `room-${code}`,
      code,
      mediaId: 'movie-1',
      mediaTitle: 'Película de Ejemplo',
      mediaPoster: 'https://picsum.photos/seed/room/300/450',
      hostId: 'host-user',
      participants: [
        {
          id: 'host-user',
          name: 'Host',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host',
          isHost: true,
          isWatching: true,
          isOnline: true,
        },
      ],
      createdAt: new Date().toISOString(),
      isPrivate: true,
    };
  }
  return null;
};

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

  createRoom: async (mediaId, mediaTitle, mediaPoster) => {
    set({ isLoading: true, error: null });
    try {
      const room = await mockCreateRoom(mediaId, mediaTitle, mediaPoster);
      set({
        room,
        isHost: true,
        isLoading: false,
        isConnected: true,
        messages: [],
      });
      return room.code;
    } catch (error) {
      set({ isLoading: false, error: 'Error al crear la sala' });
      return null;
    }
  },

  joinRoom: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const room = await mockJoinRoom(code);
      if (room) {
        set({
          room,
          isHost: false,
          isLoading: false,
          isConnected: true,
          messages: [],
        });
        return true;
      }
      set({ isLoading: false, error: 'Código de sala inválido' });
      return false;
    } catch (error) {
      set({ isLoading: false, error: 'Error al unirse a la sala' });
      return false;
    }
  },

  leaveRoom: () => {
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

  kickParticipant: (userId) => {
    const { isHost, removeParticipant } = get();
    if (isHost) {
      removeParticipant(userId);
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
    const newMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  clearMessages: () => set({ messages: [] }),

  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
