import { useCallback } from 'react';
import { useRoomStore } from '@/stores/roomStore';
import type { VideoQuality } from '@/types';

export const useRooms = () => {
  const {
    room,
    isHost,
    videoState,
    messages,
    isConnected,
    isLoading,
    error,
    setRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    addParticipant,
    removeParticipant,
    updateParticipant,
    kickParticipant,
    setVideoPlaying,
    setVideoTime,
    setVideoDuration,
    setVideoVolume,
    setVideoQuality,
    setVideoPlaybackRate,
    syncVideoState,
    addMessage,
    clearMessages,
    setConnected,
    setLoading,
    setError,
  } = useRoomStore();

  const sendMessage = useCallback((text: string, userId: string, userName: string, userAvatar?: string) => {
    if (!room) return;
    addMessage({ userId, userName, text, userAvatar });
  }, [room, addMessage]);

  const play = useCallback(() => {
    setVideoPlaying(true);
  }, [setVideoPlaying]);

  const pause = useCallback(() => {
    setVideoPlaying(false);
  }, [setVideoPlaying]);

  const seek = useCallback((time: number) => {
    setVideoTime(time);
  }, [setVideoTime]);

  const changeVolume = useCallback((volume: number) => {
    setVideoVolume(Math.max(0, Math.min(1, volume)));
  }, [setVideoVolume]);

  const changeQuality = useCallback((quality: VideoQuality) => {
    setVideoQuality(quality);
  }, [setVideoQuality]);

  const changePlaybackRate = useCallback((rate: number) => {
    setVideoPlaybackRate(rate);
  }, [setVideoPlaybackRate]);

  const getOnlineParticipants = useCallback(() => {
    return room?.participants.filter((p) => p.isOnline) || [];
  }, [room]);

  const getHost = useCallback(() => {
    return room?.participants.find((p) => p.isHost);
  }, [room]);

  return {
    // State
    room,
    isHost,
    videoState,
    messages,
    isConnected,
    isLoading,
    error,
    
    // Room actions
    setRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    
    // Participant actions
    addParticipant,
    removeParticipant,
    updateParticipant,
    kickParticipant,
    getOnlineParticipants,
    getHost,
    
    // Video controls
    play,
    pause,
    seek,
    changeVolume,
    changeQuality,
    changePlaybackRate,
    setVideoPlaying,
    setVideoTime,
    setVideoDuration,
    setVideoVolume,
    syncVideoState,
    
    // Chat
    sendMessage,
    clearMessages,
    
    // Connection
    setConnected,
    setLoading,
    setError,
  };
};
