import { useState, useCallback, useEffect } from 'react';
import type { Friend } from '@/types';
import { apiService } from '@/lib/api-service';
import { useAuthStore } from '@/stores/authStore';
import { globalPresenceService, type UserPresence } from '@/lib/global-presence';

export interface FriendRequest {
  id: string;
  name: string;
  avatar?: string;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuthStore((state) => state.user);
  const [onlineUserMap, setOnlineUserMap] = useState<Record<string, UserPresence>>({});

  // Load friends from API
  const loadFriends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getFriends();
      const formattedFriends: Friend[] = data.map((f) => ({
        id: f.id,
        name: f.name,
        avatar: f.avatar,
        isOnline: f.status === 'online',
        isWatching: !!f.watching,
        currentMedia: f.watching,
        roomCode: f.roomCode,
      }));
      setFriends(formattedFriends);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load pending requests
  const loadRequests = useCallback(async () => {
    try {
      const data = await apiService.getPendingRequests();
      const formattedRequests: FriendRequest[] = data.map((r) => ({
        id: r.id,
        name: r.name,
        avatar: r.avatar,
      }));
      setRequests(formattedRequests);
    } catch (err) {
      console.error('Error loading friend requests:', err);
    }
  }, []);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadFriends();
    loadRequests();
  }, [isAuthenticated, loadFriends, loadRequests]);

  // Subscribe to global presence updates
  useEffect(() => {
    const handlePresenceUpdate = (users: UserPresence[]) => {
      const map: Record<string, UserPresence> = {};
      for (const u of users) {
        map[u.id] = u;
      }
      setOnlineUserMap(map);
    };

    globalPresenceService.onPresenceSync(handlePresenceUpdate);
    // Get initial snapshot
    const initial = globalPresenceService.getOnlineUsers();
    if (initial.length > 0) {
      const map: Record<string, UserPresence> = {};
      for (const u of initial) map[u.id] = u;
      setOnlineUserMap(map);
    }
  }, []);

  // Merge friends with real-time presence data
  const enrichedFriends: Friend[] = friends.map((f) => {
    const presence = onlineUserMap[f.id];
    if (presence) {
      return {
        ...f,
        isOnline: true,
        isWatching: !!presence.watching,
        currentMedia: presence.watching || f.currentMedia,
        roomCode: presence.roomCode || f.roomCode,
      };
    }
    return { ...f, isOnline: false, isWatching: false };
  });

  const onlineFriends = enrichedFriends.filter((f) => f.isOnline);
  const offlineFriends = enrichedFriends.filter((f) => !f.isOnline);
  const watchingFriends = enrichedFriends.filter((f) => f.isOnline && f.isWatching);

  const addFriend = useCallback(async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.sendFriendRequest(userId);
      await loadFriends();
      setIsLoading(false);
      return true;
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
      return false;
    }
  }, [loadFriends]);

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      await apiService.removeFriend(friendId);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  }, []);

  const acceptRequest = useCallback(async (userId: string) => {
    try {
      await apiService.acceptFriendRequest(userId);
      setRequests((prev) => prev.filter((r) => r.id !== userId));
      await loadFriends();
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  }, [loadFriends]);

  const rejectRequest = useCallback((requestId: string) => {
    // For now just remove from UI, backend will handle rejection
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const getFriendById = useCallback((id: string) => {
    return enrichedFriends.find((f) => f.id === id);
  }, [enrichedFriends]);

  const updateFriendStatus = useCallback((friendId: string, isOnline: boolean) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, isOnline } : f))
    );
  }, []);

  const updateFriendActivity = useCallback((friendId: string, isWatching: boolean, currentMedia?: string, roomCode?: string) => {
    setFriends((prev) =>
      prev.map((f) =>
        f.id === friendId ? { ...f, isWatching, currentMedia, roomCode } : f
      )
    );
  }, []);

  return {
    // Data — use enriched friends with real-time presence
    friends: enrichedFriends,
    requests,
    onlineFriends,
    offlineFriends,
    watchingFriends,
    isLoading,
    error,
    currentUser,

    // Actions
    addFriend,
    removeFriend,
    acceptRequest,
    rejectRequest,
    getFriendById,
    updateFriendStatus,
    updateFriendActivity,
    refreshFriends: loadFriends,
    refreshRequests: loadRequests,
  };
};
