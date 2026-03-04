import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { Mail, Lock, User, Film, ArrowRight, Check } from 'lucide-react';
import { GoogleButton } from './GoogleButton';

interface RegisterFormProps {
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ className }) => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { showError, showSuccess } = useNotifications();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [waitlistError, setWaitlistError] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (name.length < 2) {
      newErrors.name = 'Mínimo 2 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'Debes aceptar los términos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await register(email, password, name);
    if (result.success) {
      showSuccess('Cuenta creada', 'Bienvenido a PlexParty');
      navigate('/');
    } else if (result.isPending) {
      setWaitlistError(true);
    } else {
      const msg = result.error === 'User already registered'
        ? 'Este email ya esta registrado'
        : result.error || 'Error al registrarse';
      showError('Error al registrarse', msg);
    }
  };

  if (waitlistError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">¡Estás en la Lista de Espera!</h1>
        <p className="text-white/70 max-w-md mx-auto mb-8">
          Hemos recibido tu solicitud de registro con éxito. Actualmente, PlexParty requiere aprobación del administrador.
          Por favor, espera a que tu cuenta sea aprobada para poder iniciar sesión.
        </p>
        <Button onClick={() => navigate('/login')} variant="primary">
          Ir al Inicio de Sesión
        </Button>
      </div>
    );
  }

  const passwordStrength = (pass: string): { strength: number; label: string } => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;

    const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte'];
    return { strength, label: labels[strength] };
  };

  const { strength, label } = passwordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-yellow-400', 'bg-green-500', 'bg-green-400'];

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35] to-[#ff8555] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#ff6b35]/25">
          <Film className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Crear cuenta en <span className="text-[#ff6b35]">PlexParty</span>
        </h1>
        <p className="text-white/60">Únete y disfruta con tus amigos</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre completo"
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User className="w-5 h-5" />}
          error={errors.name}
          disabled={isLoading}
        />

        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email}
          disabled={isLoading}
        />

        <div>
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            error={errors.password}
            disabled={isLoading}
          />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 h-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-full transition-colors',
                      i < strength ? strengthColors[strength] : 'bg-white/10'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-white/50 mt-1">{label}</p>
            </div>
          )}
        </div>

        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Check className="w-5 h-5" />}
          error={errors.confirmPassword}
          disabled={isLoading}
        />

        <label className={cn(
          'flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer',
          agreeTerms
            ? 'bg-[#ff6b35]/10 border-[#ff6b35]/30'
            : 'bg-white/5 border-white/10 hover:bg-white/10',
          errors.agreeTerms && 'border-red-500/50'
        )}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-[#ff6b35] focus:ring-[#ff6b35]"
          />
          <span className="text-sm text-white/70">
            Acepto los{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                showError('Próximamente', 'Términos en desarrollo');
              }}
              className="text-[#ff6b35] hover:text-[#ff8555]"
            >
              términos y condiciones
            </button>{' '}
            y la{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                showError('Próximamente', 'Política en desarrollo');
              }}
              className="text-[#ff6b35] hover:text-[#ff8555]"
            >
              política de privacidad
            </button>
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="text-sm text-red-400 -mt-2">{errors.agreeTerms}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Crear cuenta
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/40 text-sm">o también mediante</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <GoogleButton isRegister={true} />
      </div>

      {/* Login link */}
      <p className="text-center text-white/60 mt-6">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-[#ff6b35] hover:text-[#ff8555] font-medium transition-colors"
        >
          Iniciar sesión
        </button>
      </p>
    </div>
  );
};
