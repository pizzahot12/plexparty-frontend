// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  friendCode?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Media types
export type MediaType = 'movie' | 'series';

export interface Media {
  id: string;
  title: string;
  type: MediaType;
  poster: string;
  backdrop?: string;
  rating: number;
  year: number;
  duration?: number; // in minutes
  synopsis: string;
  genres: string[];
  cast?: CastMember[];
  director?: string;
  seasons?: Season[];
}

export interface CastMember {
  id: string;
  name: string;
  character?: string;
  avatar?: string;
}

export interface Season {
  id: string;
  number: number;
  title: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  duration: number;
  synopsis: string;
  thumbnail?: string;
}

// Room types
export interface Room {
  id: string;
  code: string;
  name?: string;
  hostId: string;
  mediaId: string;
  mediaTitle?: string;
  mediaPoster?: string;
  participants: Participant[];
  createdAt: string;
  isPrivate: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isWatching: boolean;
  isOnline: boolean;
}

export interface RoomState {
  room: Room | null;
  isHost: boolean;
  videoState: VideoState;
}

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  quality: VideoQuality;
  playbackRate: number;
}

export type VideoQuality = 'auto' | '480p' | '720p' | '1080p' | '4K';

// Chat types
export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
}

// Friend types
export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  isWatching?: boolean;
  currentMedia?: string;
  roomCode?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'invite';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  roomCode?: string;
  mediaTitle?: string;
  createdAt: string;
  read: boolean;
  dismissed?: boolean;
}

// Stream types
export interface StreamInfo {
  url: string;
  qualities: VideoQuality[];
  audioTracks?: AudioTrack[];
  subtitleTracks?: SubtitleTrack[];
}

export interface AudioTrack {
  id: string;
  language: string;
  label: string;
  isDefault?: boolean;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  isDefault?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket event types
export type WebSocketEvent =
  | 'user_joined'
  | 'user_left'
  | 'message_sent'
  | 'playback_sync'
  | 'user_kicked'
  | 'quality_changed'
  | 'subtitle_changed';

export interface WebSocketMessage {
  event: WebSocketEvent;
  data: unknown;
  timestamp: string;
}
