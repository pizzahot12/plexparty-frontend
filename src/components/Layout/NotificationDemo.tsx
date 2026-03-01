import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { Bell, UserPlus, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const NotificationDemo: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo, showInvite } = useNotifications();

  const demoInvite = () => {
    showInvite(
      'María García',
      'El Padrino',
      'ABC123',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
      'user-123'
    );
  };

  const demoSuccess = () => {
    showSuccess('¡Éxito!', 'La operación se completó correctamente');
  };

  const demoError = () => {
    showError('Error', 'Algo salió mal. Intenta de nuevo.');
  };

  const demoWarning = () => {
    showWarning('Advertencia', 'Tu conexión es inestable');
  };

  const demoInfo = () => {
    showInfo('Información', 'Nueva actualización disponible');
  };

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#ff6b35]" />
        Demo de Notificaciones
      </h3>
      <p className="text-white/60 text-sm mb-4">
        Haz clic en los botones para ver ejemplos de notificaciones
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={demoInvite}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Invitación a sala
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={demoSuccess}
          leftIcon={<CheckCircle className="w-4 h-4" />}
        >
          Éxito
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={demoError}
          leftIcon={<AlertCircle className="w-4 h-4" />}
        >
          Error
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={demoWarning}
          leftIcon={<AlertCircle className="w-4 h-4" />}
        >
          Advertencia
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={demoInfo}
          leftIcon={<Info className="w-4 h-4" />}
        >
          Info
        </Button>
      </div>
    </div>
  );
};
