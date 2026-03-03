import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRooms } from '@/hooks/useRooms';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Play, Lock, Globe, Users, Film } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
  mediaTitle: string;
  mediaPoster?: string;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  mediaId,
  mediaTitle,
  mediaPoster,
}) => {
  const navigate = useNavigate();
  const { createRoom } = useRooms();
  const { showSuccess, showError } = useNotifications();

  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    const code = await createRoom(mediaId, mediaTitle, mediaPoster, isPrivate);
    setIsCreating(false);

    if (code) {
      showSuccess('Sala creada', `Código: ${code}`);
      onClose();
      navigate(`/watch/${code}`);
    } else {
      showError('Error', 'No se pudo crear la sala');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#242424] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Play className="w-5 h-5 text-[#ff6b35]" />
            Crear sala privada
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Configura tu sala para ver {mediaTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Media preview */}
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
            {mediaPoster && (
              <img
                src={mediaPoster}
                alt={mediaTitle}
                className="w-16 h-24 object-cover rounded-lg"
              />
            )}
            <div>
              <p className="text-white font-medium">{mediaTitle}</p>
              <p className="text-white/50 text-sm flex items-center gap-1">
                <Film className="w-3.5 h-3.5" />
                Película
              </p>
            </div>
          </div>

          {/* Room name */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Nombre de la sala (opcional)</label>
            <Input
              placeholder="Sala de {tu nombre}"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              leftIcon={<Users className="w-5 h-5" />}
            />
          </div>

          {/* Privacy settings */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Privacidad</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsPrivate(true)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors',
                  isPrivate
                    ? 'bg-[#ff6b35]/10 border-[#ff6b35]/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                )}
              >
                <Lock className={cn('w-6 h-6', isPrivate ? 'text-[#ff6b35]' : 'text-white/50')} />
                <span className={cn('text-sm', isPrivate ? 'text-white' : 'text-white/50')}>
                  Privada
                </span>
                <span className="text-xs text-white/40">Solo con código</span>
              </button>
              <button
                onClick={() => setIsPrivate(false)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors',
                  !isPrivate
                    ? 'bg-[#ff6b35]/10 border-[#ff6b35]/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                )}
              >
                <Globe className={cn('w-6 h-6', !isPrivate ? 'text-[#ff6b35]' : 'text-white/50')} />
                <span className={cn('text-sm', !isPrivate ? 'text-white' : 'text-white/50')}>
                  Pública
                </span>
                <span className="text-xs text-white/40">Cualquiera puede unirse</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isLoading={isCreating}
            leftIcon={<Play className="w-5 h-5" />}
            className="flex-1"
          >
            Crear sala
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
