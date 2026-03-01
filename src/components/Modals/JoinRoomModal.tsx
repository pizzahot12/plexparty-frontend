import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { DoorOpen, KeyRound, QrCode, ArrowRight } from 'lucide-react';
import { ROOM_CODE_LENGTH } from '@/lib/constants';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { joinRoom } = useRooms();
  const { showSuccess, showError } = useNotifications();
  
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleJoin = async () => {
    if (roomCode.length !== ROOM_CODE_LENGTH) {
      showError('Código inválido', `El código debe tener ${ROOM_CODE_LENGTH} caracteres`);
      return;
    }

    setIsJoining(true);
    const success = await joinRoom(roomCode.toUpperCase());
    setIsJoining(false);
    
    if (success) {
      showSuccess('¡Bienvenido!', 'Te has unido a la sala');
      onClose();
      navigate(`/watch/${roomCode.toUpperCase()}`);
    } else {
      showError('Error', 'Código de sala inválido o sala no encontrada');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#242424] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-[#ff6b35]" />
            Unirse a sala
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Ingresa el código de la sala para unirte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Code input */}
          {!showQR && (
            <div>
              <label className="text-white/70 text-sm mb-2 block">Código de la sala</label>
              <div className="flex gap-2">
                <Input
                  placeholder={`${ROOM_CODE_LENGTH} dígitos`}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={ROOM_CODE_LENGTH}
                  leftIcon={<KeyRound className="w-5 h-5" />}
                  className="flex-1 text-center text-2xl tracking-[0.5em] font-mono"
                  disabled={isJoining}
                />
              </div>
              <p className="text-white/40 text-xs mt-2 text-center">
                Pide el código al host de la sala
              </p>
            </div>
          )}

          {/* QR Scanner */}
          {showQR && (
            <div className="aspect-square max-w-xs mx-auto bg-black rounded-xl flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-white/30 mx-auto mb-2" />
                <p className="text-white/50 text-sm">Escáner QR</p>
                <p className="text-white/30 text-xs">(Próximamente)</p>
              </div>
            </div>
          )}

          {/* Alternative method */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-center gap-2 text-[#ff6b35] hover:text-[#ff8555] text-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            {showQR ? 'Usar código manual' : 'Escanear código QR'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          {!showQR && (
            <Button
              variant="primary"
              onClick={handleJoin}
              isLoading={isJoining}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="flex-1"
              disabled={roomCode.length !== ROOM_CODE_LENGTH}
            >
              Unirse
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
