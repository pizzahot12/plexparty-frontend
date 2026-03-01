import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useFriends } from '@/hooks/useFriends';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { UserPlus, Search, QrCode, Copy } from 'lucide-react';
import { FRIEND_CODE_LENGTH } from '@/lib/constants';

interface AddFriendFormProps {
  className?: string;
}

export const AddFriendForm: React.FC<AddFriendFormProps> = ({ className }) => {
  const { addFriend, isLoading } = useFriends();
  const { showSuccess, showError } = useNotifications();
  const [friendCode, setFriendCode] = useState('');
  const [showQR, setShowQR] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (friendCode.length !== FRIEND_CODE_LENGTH) {
      showError('Código inválido', `El código debe tener ${FRIEND_CODE_LENGTH} caracteres`);
      return;
    }

    const success = await addFriend(friendCode.toUpperCase());
    if (success) {
      showSuccess('Solicitud enviada', 'Espera a que acepten tu solicitud');
      setFriendCode('');
    } else {
      showError('Error', 'No se pudo enviar la solicitud');
    }
  };

  const handleCopyMyCode = () => {
    // Would copy user's friend code
    showSuccess('Código copiado', 'Comparte tu código con amigos');
  };

  return (
    <div className={cn('bg-white/5 border border-white/10 rounded-xl p-6', className)}>
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-[#ff6b35]" />
        Agregar amigo
      </h3>
      <p className="text-white/60 text-sm mb-6">
        Ingresa el código de tu amigo para enviarle una solicitud
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Código de ${FRIEND_CODE_LENGTH} dígitos`}
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
            maxLength={FRIEND_CODE_LENGTH}
            leftIcon={<Search className="w-5 h-5" />}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<UserPlus className="w-5 h-5" />}
          >
            Agregar
          </Button>
        </div>

        {/* Alternative methods */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Escanear QR
          </button>
          <div className="w-px h-4 bg-white/20" />
          <button
            type="button"
            onClick={handleCopyMyCode}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copiar mi código
          </button>
        </div>
      </form>

      {/* QR Scanner placeholder */}
      {showQR && (
        <div className="mt-4 p-4 bg-black/50 rounded-xl">
          <div className="aspect-square max-w-xs mx-auto bg-white rounded-xl flex items-center justify-center">
            <div className="text-center">
              <QrCode className="w-16 h-16 text-black/30 mx-auto mb-2" />
              <p className="text-black/50 text-sm">Escáner QR</p>
              <p className="text-black/30 text-xs">(Próximamente)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
