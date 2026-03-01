import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Media } from '@/types';
import { useMedia } from '@/hooks/useMedia';
import { useRooms } from '@/hooks/useRooms';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { 
  Play, 
  Plus, 
  Check, 
  Star, 
  Clock, 
  Users,
  Share2
} from 'lucide-react';
import { GENRE_COLORS, DEFAULT_GENRE_COLOR } from '@/lib/constants';

interface MovieDetailsProps {
  media: Media;
  className?: string;
}

export const MovieDetails: React.FC<MovieDetailsProps> = ({ media, className }) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useMedia();
  const { createRoom } = useRooms();
  const { showSuccess, showError } = useNotifications();

  const favorite = isFavorite(media.id);

  const handleCreateRoom = async () => {
    const code = await createRoom(media.id, media.title, media.poster);
    if (code) {
      showSuccess('Sala creada', `Código: ${code}`);
      navigate(`/watch/${code}`);
    } else {
      showError('Error', 'No se pudo crear la sala');
    }
  };

  const handleJoinRoom = () => {
    // This would open a modal to enter room code
    showError('Próximamente', 'Función en desarrollo');
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Backdrop */}
      <div className="absolute inset-0 h-[70vh]">
        <img
          src={media.backdrop || media.poster}
          alt={media.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/90 via-[#1a1a1a]/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="w-48 sm:w-56 lg:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                <img
                  src={media.poster}
                  alt={media.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center lg:text-left">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                {media.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-4 text-sm">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  {media.rating}
                </span>
                <span className="w-1 h-1 bg-white/40 rounded-full" />
                <span className="text-white/70">{media.year}</span>
                <span className="w-1 h-1 bg-white/40 rounded-full" />
                {media.duration && (
                  <>
                    <span className="flex items-center gap-1 text-white/70">
                      <Clock className="w-4 h-4" />
                      {formatDuration(media.duration)}
                    </span>
                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                  </>
                )}
                <span className="px-2 py-0.5 bg-[#ff6b35]/20 text-[#ff6b35] rounded text-xs font-medium">
                  Película
                </span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6">
                {media.genres.map((genre) => (
                  <span
                    key={genre}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border',
                      GENRE_COLORS[genre] || DEFAULT_GENRE_COLOR
                    )}
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <p className="text-white/70 text-base lg:text-lg leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                {media.synopsis}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Play className="w-5 h-5 fill-white" />}
                  onClick={handleCreateRoom}
                >
                  Crear Sala Privada
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={favorite ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  onClick={() => toggleFavorite(media.id)}
                >
                  {favorite ? 'En mi lista' : 'Mi lista'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<Share2 className="w-5 h-5" />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showSuccess('Enlace copiado', 'Comparte con tus amigos');
                  }}
                >
                  Compartir
                </Button>
              </div>

              {/* Join room */}
              <div className="flex items-center justify-center lg:justify-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 max-w-md mx-auto lg:mx-0">
                <span className="text-white/60 text-sm">¿Tienes un código?</span>
                <button
                  onClick={handleJoinRoom}
                  className="text-[#ff6b35] hover:text-[#ff8555] font-medium text-sm transition-colors"
                >
                  Unirme a sala
                </button>
              </div>

              {/* Cast */}
              {media.cast && media.cast.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Reparto</h3>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    {media.cast.map((actor) => (
                      <div key={actor.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white/50" />
                        </div>
                        <div className="text-left">
                          <p className="text-white text-sm font-medium">{actor.name}</p>
                          {actor.character && (
                            <p className="text-white/50 text-xs">{actor.character}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Director */}
              {media.director && (
                <div className="mt-6">
                  <span className="text-white/50 text-sm">Director: </span>
                  <span className="text-white text-sm">{media.director}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
