import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/Watch/VideoPlayer';
import { ChatPanel } from '@/components/Watch/ChatPanel';
import { RoomInfo } from '@/components/Watch/RoomInfo';
import { AdminPanel } from '@/components/Watch/AdminPanel';
import { useRooms } from '@/hooks/useRooms';
import { useRoomStore } from '@/stores/roomStore';
import { useAuth } from '@/hooks/useAuth';
import { useMedia } from '@/hooks/useMedia';
import { Loading } from '@/components/Common/Loading';
import { Button } from '@/components/Common/Button';
import { ArrowLeft, MessageSquare, Users, Crown } from 'lucide-react';

import { apiService } from '@/lib/api-service';

const WatchPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  useAuth();
  const { room, isHost, joinRoom, leaveRoom } = useRooms();
  const { getMediaById } = useMedia();

  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMobileAdmin, setShowMobileAdmin] = useState(false);

  // Sync progress every 10 seconds
  useEffect(() => {
    if (!room?.mediaId) return;

    const interval = setInterval(() => {
      const { currentTime, duration } = useRoomStore.getState().videoState;
      if (currentTime > 0 && duration > 0) {
        apiService.updateWatchProgress(room.mediaId, currentTime, duration).catch(() => { });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [room?.mediaId]);

  useEffect(() => {
    const loadRoom = async () => {
      if (roomId && !room) {
        await joinRoom(roomId);
      }
      setIsLoading(false);
    };
    loadRoom();

    return () => {
      leaveRoom();
      // Clear watching status from global presence
      import('@/lib/global-presence').then(({ globalPresenceService }) => {
        globalPresenceService.setWatching(undefined, undefined);
      });
    };
  }, [roomId]);

  // Update global presence when room loads
  useEffect(() => {
    if (room) {
      import('@/lib/global-presence').then(({ globalPresenceService }) => {
        globalPresenceService.setWatching(room.name || 'Sala', room.code);
      });
    }
  }, [room?.id]);

  const media = room?.mediaId ? getMediaById(room.mediaId) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading text="Cargando sala..." />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-lg">Sala no encontrada</p>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="mt-4"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-black">
      {/* Header */}
      <header className="h-14 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-medium truncate max-w-[150px] sm:max-w-xs lg:max-w-md">
              {media?.title || room.mediaTitle || 'Sala de visualización'}
            </h1>
            {room.code && (
              <p className="text-white/50 text-xs">Código: {room.code}</p>
            )}
          </div>
        </div>

        {/* Desktop toggles */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showChat
                ? 'bg-[#ff6b35] text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showParticipants
                ? 'bg-[#ff6b35] text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            <Users className="w-5 h-5" />
          </button>
          {isHost && (
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showAdmin
                  ? 'bg-yellow-500 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <Crown className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mobile: only show admin crown for host */}
        {isHost && (
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileAdmin(!showMobileAdmin)}
              className={cn(
                'min-h-11 min-w-11 flex items-center justify-center rounded-lg transition-colors touch-manipulation',
                showMobileAdmin
                  ? 'bg-yellow-500 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <Crown className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">

        {/* Video: aspect-video (16:9) sticky top on mobile, flex-1 on desktop */}
        <div className="w-full aspect-video flex-shrink-0 bg-black lg:aspect-auto lg:flex-1">
          <VideoPlayer
            mediaId={room?.mediaId}
            poster={media?.backdrop || media?.poster}
            className="h-full w-full"
            onToggleChat={() => setShowChat(!showChat)}
            onToggleParticipants={() => setShowParticipants(!showParticipants)}
            showChat={showChat}
            showParticipants={showParticipants}
          />
        </div>

        {/* Mobile: chat always visible below video */}
        <div className="lg:hidden flex-1 min-h-0 overflow-hidden flex flex-col border-t border-white/10">
          {showMobileAdmin && isHost
            ? <AdminPanel />
            : <ChatPanel isOpen />
          }
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          {showChat && (
            <div className="w-80 border-l border-white/10">
              <ChatPanel isOpen={showChat} onClose={() => setShowChat(false)} />
            </div>
          )}
          {showParticipants && (
            <div className="w-72 border-l border-white/10">
              <RoomInfo isOpen={showParticipants} onClose={() => setShowParticipants(false)} />
            </div>
          )}
          {isHost && showAdmin && (
            <div className="w-72 border-l border-white/10">
              <AdminPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
