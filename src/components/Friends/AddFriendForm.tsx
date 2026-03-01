import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useFriends } from '@/hooks/useFriends';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { UserPlus, User } from 'lucide-react';

interface AddFriendFormProps {
  className?: string;
}

export const AddFriendForm: React.FC<AddFriendFormProps> = ({ className }) => {
  const { addFriend, isLoading } = useFriends();
  const { showSuccess, showError } = useNotifications();
  const [userId, setUserId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      showError('ID inválido', 'Ingresa el ID del usuario');
      return;
    }

    const success = await addFriend(userId.trim());
    if (success) {
      showSuccess('Solicitud enviada', 'Espera a que acepten tu solicitud');
      setUserId('');
    } else {
      showError('Error', 'No se pudo enviar la solicitud. Verifica el ID.');
    }
  };

  return (
    <div className={cn('bg-white/5 border border-white/10 rounded-xl p-6', className)}>
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-[#ff6b35]" />
        Agregar amigo
      </h3>
      <p className="text-white/60 text-sm mb-6">
        Ingresa el ID de usuario de tu amigo para enviarle una solicitud
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="ID de usuario (UUID)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            leftIcon={<User className="w-5 h-5" />}
            className="flex-1 font-mono text-sm"
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

        <p className="text-white/40 text-xs">
          Puedes encontrar el ID de usuario en el perfil de tu amigo
        </p>
      </form>
    </div>
  );
};
