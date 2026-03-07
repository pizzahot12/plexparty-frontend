import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useFriends } from '@/hooks/useFriends';
import { apiService } from '@/lib/api-service';
import {
  Crown,
  UserX,
  UserPlus,
  Lock,
  Unlock,
  Settings,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';

interface AdminPanelProps {
  className?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ className }) => {
  const { user } = useAuth();
  const { room, isHost, kickParticipant } = useRooms();
  const { showSuccess, showError } = useNotifications();
  const { friends } = useFriends();
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);

  if (!isHost || !room) return null;

  const handleKick = (participantId: string, participantName: string) => {
    if (participantId === user?.id) {
      showError('Error', 'No puedes expulsarte a ti mismo');
      return;
    }
    kickParticipant(participantId);
    showSuccess('Usuario expulsado', `${participantName} ha sido expulsado de la sala`);
  };

  const handleInvite = async (friendId: string, friendName: string) => {
    try {
      if (!room) return;
      await apiService.inviteToRoom(room.id, friendId);
      showSuccess('Invitación enviada', `Invitación enviada a ${friendName}`);
    } catch {
      showError('Error', 'No se pudo enviar la invitación');
    }
    setShowInviteMenu(false);
  };

  const togglePrivacy = async () => {
    try {
      if (!room) return;
      await apiService.updateRoomPrivacy(room.id, !isPrivate);
      setIsPrivate(!isPrivate);
      showSuccess(
        !isPrivate ? 'Sala privada' : 'Sala pública',
        !isPrivate ? 'Solo con invitación' : 'Cualquiera puede unirse'
      );
    } catch {
      showError('Error', 'No se pudo actualizar la privacidad');
    }
  };

  const onlineFriends = friends.filter((f) => f.isOnline && !room?.participants.some((p: { id: string }) => p.id === f.id));

  return (
    <div className={cn('bg-[#1a1a1a] border-l border-white/10 h-full flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Panel de Admin</h3>
            <p className="text-white/50 text-sm">Eres el host de esta sala</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-4 space-y-3">
        {/* Privacy toggle */}
        <button
          onClick={togglePrivacy}
          className={cn(
            'w-full flex items-center justify-between p-3 rounded-xl border transition-colors',
            isPrivate
              ? 'bg-white/5 border-white/10'
              : 'bg-green-500/10 border-green-500/30'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isPrivate ? 'bg-white/10' : 'bg-green-500/20'
            )}>
              {isPrivate ? (
                <Lock className="w-4 h-4 text-white/70" />
              ) : (
                <Unlock className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">
                {isPrivate ? 'Sala privada' : 'Sala pública'}
              </p>
              <p className="text-white/50 text-xs">
                {isPrivate ? 'Solo con invitación' : 'Cualquiera puede unirse'}
              </p>
            </div>
          </div>
          <div className={cn(
            'w-10 h-6 rounded-full relative transition-colors',
            isPrivate ? 'bg-white/20' : 'bg-green-500'
          )}>
            <div className={cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
              isPrivate ? 'left-1' : 'left-5'
            )} />
          </div>
        </button>

        {/* Invite friends - desktop only */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setShowInviteMenu(!showInviteMenu)}
            className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#ff6b35]/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-[#ff6b35]" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-medium">Invitar amigos</p>
                <p className="text-white/50 text-xs">{onlineFriends.length} amigos en línea</p>
              </div>
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 text-white/50 transition-transform',
              showInviteMenu && 'rotate-180'
            )} />
          </button>

          {showInviteMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#242424] border border-white/10 rounded-xl overflow-hidden shadow-xl z-10 max-h-60 overflow-y-auto">
              {onlineFriends.length === 0 ? (
                <p className="p-4 text-center text-white/50 text-sm">
                  No hay amigos en línea
                </p>
              ) : (
                onlineFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handleInvite(friend.id, friend.name)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors"
                  >
                    <img
                      src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                      alt={friend.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-white text-sm">{friend.name}</span>
                    {friend.isWatching && (
                      <span className="ml-auto text-xs text-[#ff6b35]">Viendo {friend.currentMedia}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Room settings - desktop only */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="hidden lg:flex w-full items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white/70" />
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-medium">Configuración</p>
              <p className="text-white/50 text-xs">Ajustes de la sala</p>
            </div>
          </div>
          <ChevronDown className={cn(
            'w-5 h-5 text-white/50 transition-transform',
            showSettings && 'rotate-180'
          )} />
        </button>
      </div>

      {/* Settings panel - desktop only */}
      {showSettings && (
        <div className="hidden lg:block px-4 pb-4">
          <div className="p-4 bg-white/5 rounded-xl space-y-4">
            <div>
              <label className="text-white/70 text-sm">Sincronización</label>
              <select
                className="w-full mt-1.5 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/50"
                onChange={(e) => {
                  showSuccess('Configuración guardada', `Sincronización cambiada a modo ${e.target.value === 'strict' ? 'estricto' : 'relajado'}`);
                }}
              >
                <option value="strict">Estricta (todos ven lo mismo)</option>
                <option value="relaxed">Relajada (cada uno controla)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Participants management */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-white/70 text-sm font-medium mb-3">Gestionar participantes</h4>
        <div className="space-y-2">
          {room?.participants.map((participant: { id: string; name: string; avatar?: string; isHost: boolean }) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
            >
              <img
                src={participant.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.id}`}
                alt={participant.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {participant.name}
                  {participant.id === user?.id && (
                    <span className="text-white/40 ml-1">(Tú)</span>
                  )}
                </p>
                <p className="text-white/50 text-xs">
                  {participant.isHost ? 'Host' : 'Invitado'}
                </p>
              </div>
              {participant.id !== user?.id && (
                <button
                  onClick={() => handleKick(participant.id, participant.name)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Expulsar"
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}
              {participant.isHost && (
                <Crown className="w-4 h-4 text-yellow-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 text-sm font-medium">Recuerda</p>
            <p className="text-white/60 text-xs mt-0.5">
              Como host, puedes expulsar participantes y controlar la reproducción.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
