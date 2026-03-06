import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Media } from '@/types';
import { Play, Plus, Check, Star, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';

interface HeroCarouselProps {
  media: Media[];
  className?: string;
  autoPlayInterval?: number;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  media,
  className,
  autoPlayInterval = 8000,
}) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useMedia();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentMedia = media[currentIndex];

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setProgress(0);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    const nextIndex = (currentIndex + 1) % media.length;
    goToSlide(nextIndex);
  }, [currentIndex, media.length, goToSlide]);

  const prevSlide = useCallback(() => {
    const prevIndex = currentIndex === 0 ? media.length - 1 : currentIndex - 1;
    goToSlide(prevIndex);
  }, [currentIndex, media.length, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (media.length <= 1) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + (100 / (autoPlayInterval / 100));
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [currentIndex, media.length, autoPlayInterval, nextSlide]);

  if (!currentMedia) return null;

  const favorite = isFavorite(currentMedia.id);

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      {/* Background image */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[70vh]">
        {media.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={item.backdrop || item.poster}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlays - más fuertes en móvil */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#1a1a1a]/80 to-[#1a1a1a]/40 sm:via-[#1a1a1a]/70 sm:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/50 to-transparent sm:via-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="absolute inset-0 flex items-end sm:items-center pb-8 sm:pb-0">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              {/* Tags - scrollable en móvil */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {currentMedia.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="flex-shrink-0 px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white/80"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Title - más pequeño en móvil */}
              <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight line-clamp-2">
                {currentMedia.title}
              </h1>

              {/* Meta info - wrap en móvil */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                  {currentMedia.rating}
                </span>
                <span>{currentMedia.year}</span>
                {currentMedia.duration && (
                  <span className="hidden sm:inline">{Math.floor(currentMedia.duration / 60)}h {currentMedia.duration % 60}m</span>
                )}
                <span className="capitalize px-2 py-0.5 bg-[#ff6b35]/20 text-[#ff6b35] rounded text-xs">
                  {currentMedia.type === 'movie' ? 'Película' : 'Serie'}
                </span>
              </div>

              {/* Synopsis - oculta en móvil pequeño */}
              <p className="hidden sm:block text-white/70 text-sm lg:text-lg mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
                {currentMedia.synopsis}
              </p>

              {/* Actions - apilados en móvil, fila en desktop */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigate(`/details/${currentMedia.id}`)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#ff6b35] text-white font-medium rounded-xl hover:bg-[#ff8555] transition-colors shadow-lg shadow-[#ff6b35]/25"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  Ver ahora
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(currentMedia.id)}
                    className={cn(
                      'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-colors border-2',
                      favorite
                        ? 'bg-[#ff6b35] border-[#ff6b35] text-white'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    )}
                  >
                    {favorite ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    <span className="sm:hidden">{favorite ? 'En lista' : 'Agregar'}</span>
                    <span className="hidden sm:inline">{favorite ? 'En mi lista' : 'Agregar'}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/details/${currentMedia.id}`)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-white/10 border-2 border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                  >
                    <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="sm:hidden">Info</span>
                    <span className="hidden sm:inline">Más info</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation arrows - más pequeños en móvil */}
        {media.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 min-w-11 min-h-11 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 min-w-11 min-h-11 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors touch-manipulation"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Progress indicators */}
        {media.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="relative h-1 rounded-full overflow-hidden bg-white/20 transition-all duration-300"
                style={{ width: index === currentIndex ? '32px' : '16px' }}
              >
                {index === currentIndex && (
                  <div
                    className="absolute inset-0 bg-[#ff6b35] transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                )}
                {index < currentIndex && (
                  <div className="absolute inset-0 bg-[#ff6b35]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
