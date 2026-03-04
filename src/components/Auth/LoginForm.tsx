import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { Mail, Lock, Film, ArrowRight } from 'lucide-react';
import { GoogleButton } from './GoogleButton';

interface LoginFormProps {
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ className }) => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showError } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      const msg = result.error === 'Invalid login credentials'
        ? 'Email o contrasena incorrectos'
        : result.error || 'Error de inicio de sesion';
      showError('Error de inicio de sesion', msg);
    }
  };

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35] to-[#ff8555] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#ff6b35]/25">
          <Film className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Bienvenido a <span className="text-[#ff6b35]">PlexParty</span>
        </h1>
        <p className="text-white/60">Inicia sesión para continuar</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-white/60 cursor-pointer hover:text-white/80 transition-colors">
            <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#ff6b35] focus:ring-[#ff6b35]" />
            Recordarme
          </label>
          <button
            type="button"
            onClick={() => showError('Próximamente', 'Función en desarrollo')}
            className="text-[#ff6b35] hover:text-[#ff8555] transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Iniciar sesión
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/40 text-sm">o</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Social login */}
      <div className="grid grid-cols-1 gap-3">
        <GoogleButton />
      </div>

      {/* Register link */}
      <p className="text-center text-white/60 mt-6">
        ¿No tienes cuenta?{' '}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="text-[#ff6b35] hover:text-[#ff8555] font-medium transition-colors"
        >
          Crear cuenta
        </button>
      </p>
    </div>
  );
};
