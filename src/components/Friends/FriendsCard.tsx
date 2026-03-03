import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Friend } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';
import { useFriendChatStore } from '@/stores/friendChatStore';
import { Play, MessageSquare, MoreVertical, Film, UserX, Ban, Volume2 } from 'lucide-react';

interface FriendsCardProps {
  friend: Friend;
  showJoinButton?: boolean;
  className?: string;
  onRemove?: (friendId: string) => void;
}

export const FriendsCard: React.FC<FriendsCardProps> = ({
  friend,
  showJoinButton = false,
  className,
  onRemove,
}) => {
  const navigate = useNavigate();
  const { showInfo, showSuccess } = useNotifications();
  const { openChat } = useFriendChatStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleJoinRoom = () => {
    if (friend.roomCode) {
      navigate(`/watch/${friend.roomCode}`);
    }
  };

  const handleMessage = () => {
    openChat(friend.id);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(friend.id);
      showSuccess('Amigo eliminado', `${friend.name} ha sido eliminado de tu lista`);
    }
    setShowMenu(false);
  };

  const handleBlock = () => {
    showInfo('Usuario bloqueado', `${friend.name} ha sido bloqueado`);
    setShowMenu(false);
  };

  const handleMute = () => {
    showInfo('Notificaciones silenciadas', `No recibirás notificaciones de ${friend.name}`);
    setShowMenu(false);
  };

  return (
    <>
      <div
        className={cn(
          'group relative bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-200',
          'hover:bg-white/10 hover:border-white/20',
          className
        )}
      >
        {/* Online indicator */}
        <div
          className={cn(
            'absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-[#1a1a1a]',
            friend.isOnline ? 'bg-green-400' : 'bg-gray-500'
          )}
        />

        {/* Avatar and info */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
              alt={friend.name}
              className="w-14 h-14 rounded-full bg-white/10"
            />
            {friend.isWatching && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#ff6b35] rounded-full flex items-center justify-center">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-white font-medium truncate">{friend.name}</h4>

            {friend.isWatching && friend.currentMedia ? (
              <div className="mt-1">
                <p className="text-[#ff6b35] text-sm flex items-center gap-1">
                  <Film className="w-3.5 h-3.5" />
                  Viendo {friend.currentMedia}
                </p>
              </div>
            ) : friend.isOnline ? (
              <p className="text-green-400 text-sm mt-1">En línea</p>
            ) : (
              <p className="text-white/50 text-sm mt-1">Desconectado</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {showJoinButton && friend.isWatching && friend.roomCode && (
            <button
              onClick={handleJoinRoom}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#ff6b35] text-white text-sm font-medium rounded-lg hover:bg-[#ff8555] transition-colors"
            >
              <Play className="w-4 h-4 fill-white" />
              Unirme
            </button>
          )}

          <button
            onClick={handleMessage}
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
              'bg-white/10 text-white hover:bg-white/20',
              !showJoinButton && 'flex-1'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Mensaje
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showMenu
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#242424] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                  <button
                    onClick={handleMute}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm">Silenciar</span>
                  </button>
                  <button
                    onClick={handleBlock}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <Ban className="w-4 h-4" />
                    <span className="text-sm">Bloquear</span>
                  </button>
                  <div className="border-t border-white/10" />
                  <button
                    onClick={handleRemove}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <UserX className="w-4 h-4" />
                    <span className="text-sm">Eliminar amigo</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
