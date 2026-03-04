import React, { useState } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { useNotifications } from '@/hooks/useNotifications';
import { useRooms } from '@/hooks/useRooms';
import { apiService } from '@/lib/api-service';
import { Button } from '@/components/Common/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { UserPlus, Search, Check, Copy, Link2, Send } from 'lucide-react';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onClose,
  roomCode,
}) => {
  const { onlineFriends } = useFriends();
  const { room } = useRooms();
  const { showSuccess, showError } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

  const filteredFriends = onlineFriends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !invitedFriends.includes(f.id)
  );

  const handleInvite = async (friendId: string, friendName: string) => {
    if (!room) return;
    try {
      await apiService.inviteToRoom(room.id, friendId);
      setInvitedFriends((prev) => [...prev, friendId]);
      showSuccess('Invitación enviada', `Invitaste a ${friendName}`);
    } catch (e: any) {
      showError('Error', e.message || 'No se pudo enviar la invitación');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/watch/${roomCode}`;
    navigator.clipboard.writeText(link);
    showSuccess('Enlace copiado', 'Comparte el enlace con tus amigos');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    showSuccess('Código copiado', roomCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#242424] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#ff6b35]" />
            Invitar amigos
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Invita a tus amigos a unirse a esta sala
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Room code */}
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-white/50 text-sm mb-2">Código de la sala</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-mono font-bold text-white tracking-wider">
                {roomCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Copy className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Share options */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Link2 className="w-5 h-5 text-[#ff6b35]" />
              <span className="text-white text-sm">Copiar enlace</span>
            </button>
            <button
              onClick={() => showSuccess('Próximamente', 'Compartir en redes sociales')}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Send className="w-5 h-5 text-[#ff6b35]" />
              <span className="text-white text-sm">Compartir</span>
            </button>
          </div>

          {/* Friends list */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Amigos en línea</label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Buscar amigos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/50"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredFriends.length === 0 ? (
                <p className="text-center text-white/50 text-sm py-4">
                  {searchQuery ? 'No se encontraron amigos' : 'No hay amigos en línea'}
                </p>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                  >
                    <img
                      src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{friend.name}</p>
                      {friend.isWatching && (
                        <p className="text-[#ff6b35] text-xs">Viendo {friend.currentMedia}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleInvite(friend.id, friend.name)}
                      className="px-3 py-1.5 bg-[#ff6b35] text-white text-sm rounded-lg hover:bg-[#ff8555] transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Invitar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invited count */}
          {invitedFriends.length > 0 && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              {invitedFriends.length} {invitedFriends.length === 1 ? 'amigo invitado' : 'amigos invitados'}
            </div>
          )}
        </div>

        {/* Actions */}
        <Button variant="outline" onClick={onClose} fullWidth>
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
};
