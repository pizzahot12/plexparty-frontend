import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Common/Button';
import { Film, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#ff6b35]/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#ff8555]/5 rounded-full blur-[128px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* 404 */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-[#ff6b35]/20 to-[#ff8555]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Film className="w-16 h-16 text-[#ff6b35]" />
          </div>
          <h1 className="text-8xl font-bold text-white mb-2">404</h1>
          <p className="text-2xl text-white/70">Página no encontrada</p>
        </div>

        <p className="text-white/50 max-w-md mx-auto mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida. 
          ¿Por qué no vuelves al inicio y sigues disfrutando del contenido?
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/')}
            leftIcon={<Home className="w-5 h-5" />}
          >
            Volver al inicio
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Ir atrás
          </Button>
        </div>

        {/* Suggested links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/40 text-sm mb-4">O explora:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/movies')}
              className="px-4 py-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              Películas
            </button>
            <button
              onClick={() => navigate('/series')}
              className="px-4 py-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              Series
            </button>
            <button
              onClick={() => navigate('/friends')}
              className="px-4 py-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              Amigos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
