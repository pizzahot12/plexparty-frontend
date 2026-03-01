import { useState, useCallback, useMemo } from 'react';
import type { Friend, FriendRequest } from '@/types';

// Mock friends data
const mockFriends: Friend[] = [
  {
    id: '1',
    name: 'María García',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    isOnline: true,
    isWatching: true,
    currentMedia: 'El Padrino',
    roomCode: 'ABC123',
  },
  {
    id: '2',
    name: 'Carlos López',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    isOnline: true,
    isWatching: false,
  },
  {
    id: '3',
    name: 'Ana Martínez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Juan Rodríguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan',
    isOnline: true,
    isWatching: true,
    currentMedia: 'Breaking Bad',
    roomCode: 'DEF456',
  },
  {
    id: '5',
    name: 'Laura Sánchez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laura',
    isOnline: false,
  },
];

const mockRequests: FriendRequest[] = [
  {
    id: 'req-1',
    fromUserId: '6',
    fromUserName: 'Pedro Hernández',
    fromUserAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [requests, setRequests] = useState<FriendRequest[]>(mockRequests);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onlineFriends = useMemo(() => {
    return friends.filter((f) => f.isOnline);
  }, [friends]);

  const offlineFriends = useMemo(() => {
    return friends.filter((f) => !f.isOnline);
  }, [friends]);

  const watchingFriends = useMemo(() => {
    return friends.filter((f) => f.isOnline && f.isWatching);
  }, [friends]);

  const addFriend = useCallback(async (friendCode: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (friendCode.length === 6) {
        const newFriend: Friend = {
          id: `friend-${Date.now()}`,
          name: `Nuevo Amigo ${friendCode}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendCode}`,
          isOnline: false,
        };
        setFriends((prev) => [...prev, newFriend]);
        setIsLoading(false);
        return true;
      }
      
      setError('Código de amigo inválido');
      setIsLoading(false);
      return false;
    } catch (err) {
      setError('Error al agregar amigo');
      setIsLoading(false);
      return false;
    }
  }, []);

  const removeFriend = useCallback((friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  }, []);

  const acceptRequest = useCallback((requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      const newFriend: Friend = {
        id: request.fromUserId,
        name: request.fromUserName,
        avatar: request.fromUserAvatar,
        isOnline: false,
      };
      setFriends((prev) => [...prev, newFriend]);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
  }, [requests]);

  const rejectRequest = useCallback((requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const getFriendById = useCallback((id: string) => {
    return friends.find((f) => f.id === id);
  }, [friends]);

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
    // Data
    friends,
    requests,
    onlineFriends,
    offlineFriends,
    watchingFriends,
    isLoading,
    error,
    
    // Actions
    addFriend,
    removeFriend,
    acceptRequest,
    rejectRequest,
    getFriendById,
    updateFriendStatus,
    updateFriendActivity,
  };
};
