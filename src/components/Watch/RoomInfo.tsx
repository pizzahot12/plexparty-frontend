import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Users,
  Copy,
  Check,
  Share2,
  QrCode,
  Crown,
  MoreVertical,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface RoomInfoProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const RoomInfo: React.FC<RoomInfoProps> = ({
  className,
  isOpen = true,
  onClose,
}) => {
  const { user } = useAuth();
  const { room } = useRooms();
  const { showSuccess } = useNotifications();
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (!room || !isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    showSuccess('Código copiado', room.code);
    setTimeout(() => setCopied(false), 2000);
  };

  const onlineParticipants = room.participants.filter((p: { isOnline: boolean }) => p.isOnline);
  const watchingParticipants = room.participants.filter((p: { isWatching: boolean }) => p.isWatching);

  return (
    <div className={cn(
      'flex flex-col bg-[#1a1a1a] border-l border-white/10 h-full',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff6b35]/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-[#ff6b35]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Participantes</h3>
            <p className="text-white/50 text-sm">{onlineParticipants.length} en línea</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Room code */}
      <div className="p-4 border-b border-white/10">
        <p className="text-white/50 text-sm mb-2">Código de la sala</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <span className="text-2xl font-mono font-bold text-white tracking-wider">
              {room.code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className={cn(
              'p-3 rounded-xl transition-colors',
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#242424] border border-white/10 rounded-xl overflow-hidden shadow-xl z-10">
                <button
                  onClick={() => {
                    handleCopyCode();
                    setShowShareMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar enlace
                </button>
                <button
                  onClick={() => {
                    showSuccess('Próximamente', 'QR en desarrollo');
                    setShowShareMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Mostrar QR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {room?.participants.map((participant: { id: string; name: string; avatar?: string; isHost: boolean; isOnline: boolean; isWatching: boolean }) => (
            <div
              key={participant.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-colors',
                participant.isOnline
                  ? 'bg-white/5'
                  : 'bg-white/[0.02] opacity-60'
              )}
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={participant.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.id}`}
                  alt={participant.name}
                  className="w-10 h-10 rounded-full bg-white/10"
                />
                {/* Online indicator */}
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1a1a1a]',
                    participant.isOnline ? 'bg-green-500' : 'bg-gray-500'
                  )}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">
                    {participant.name}
                  </p>
                  {participant.isHost && (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  )}
                  {participant.id === user?.id && (
                    <span className="text-xs text-white/40">(Tú)</span>
                  )}
                </div>
                <p className="text-white/50 text-xs">
                  {participant.isWatching
                    ? 'Viendo'
                    : participant.isOnline
                    ? 'En línea'
                    : 'Desconectado'}
                </p>
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                {participant.isWatching ? (
                  <div className="w-8 h-8 bg-[#ff6b35]/20 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#ff6b35] rounded-full animate-pulse" />
                  </div>
                ) : participant.isOnline ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <p className="text-lg font-bold text-white">{room?.participants.length || 0}</p>
            <p className="text-xs text-white/50">Total</p>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <p className="text-lg font-bold text-green-400">{onlineParticipants.length}</p>
            <p className="text-xs text-white/50">En línea</p>
          </div>
          <div className="text-center p-2 bg-white/5 rounded-lg">
            <p className="text-lg font-bold text-[#ff6b35]">{watchingParticipants.length}</p>
            <p className="text-xs text-white/50">Viendo</p>
          </div>
        </div>
      </div>
    </div>
  );
};
