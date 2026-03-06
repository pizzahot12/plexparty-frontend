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
      {/* Container: tall on mobile (65vh), cinematic on desktop (21:9) */}
      <div className="relative min-h-[65vh] sm:min-h-0 sm:aspect-[21/9] sm:max-h-[70vh]">

        {/* Background slides */}
        {media.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            )}
          >
            {/* Image with Ken Burns when active */}
            <img
              src={item.backdrop || item.poster}
              alt={item.title}
              className={cn(
                'w-full h-full object-cover object-top',
                index === currentIndex && 'hero-kenburns'
              )}
            />
            {/* Gradients: lighter side, stronger bottom for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/70 via-[#1a1a1a]/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/30 to-transparent sm:via-transparent" />
          </div>
        ))}

        {/* Content — re-mounts on each slide to trigger hero-content-in */}
        <div
          key={`hero-content-${currentIndex}`}
          className="absolute inset-0 z-20 flex items-end sm:items-center pb-10 sm:pb-0 hero-content-in"
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              {/* Genre tags */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {currentMedia.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="flex-shrink-0 px-2.5 py-1 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full text-xs text-white/90"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight line-clamp-2 drop-shadow-lg">
                {currentMedia.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                  {currentMedia.rating}
                </span>
                <span>{currentMedia.year}</span>
                {currentMedia.duration && (
                  <span className="hidden sm:inline">{Math.floor(currentMedia.duration / 60)}h {currentMedia.duration % 60}m</span>
                )}
                <span className="capitalize px-2 py-0.5 bg-[#ff6b35]/20 text-[#ff6b35] rounded text-xs border border-[#ff6b35]/30">
                  {currentMedia.type === 'movie' ? 'Película' : 'Serie'}
                </span>
              </div>

              {/* Synopsis — visible on mobile too (taller hero allows it) */}
              {currentMedia.synopsis && (
                <p className="text-white/70 text-sm lg:text-base mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 drop-shadow">
                  {currentMedia.synopsis}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigate(`/details/${currentMedia.id}`)}
                  className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-[#ff6b35] text-white font-semibold rounded-xl hover:bg-[#ff8555] transition-colors shadow-lg shadow-[#ff6b35]/30 touch-manipulation"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  Ver ahora
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(currentMedia.id)}
                    className={cn(
                      'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors border touch-manipulation',
                      favorite
                        ? 'bg-[#ff6b35] border-[#ff6b35] text-white'
                        : 'bg-black/40 backdrop-blur-sm border-white/30 text-white hover:bg-white/20'
                    )}
                  >
                    {favorite ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    <span className="sm:hidden">{favorite ? 'En lista' : 'Agregar'}</span>
                    <span className="hidden sm:inline">{favorite ? 'En mi lista' : 'Agregar'}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/details/${currentMedia.id}`)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-sm border border-white/30 text-white rounded-xl font-medium hover:bg-white/20 transition-colors touch-manipulation"
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

        {/* Navigation arrows — hidden on mobile (use dots), visible on sm+ */}
        {media.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Progress dots — bigger & tappable on mobile */}
        {media.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="relative h-1.5 rounded-full overflow-hidden bg-white/25 transition-all duration-300 touch-manipulation min-h-[16px] flex items-center"
                style={{ width: index === currentIndex ? '36px' : '12px' }}
              >
                {index === currentIndex && (
                  <div
                    className="absolute inset-0 bg-[#ff6b35] rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                )}
                {index < currentIndex && (
                  <div className="absolute inset-0 bg-[#ff6b35] rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Mobile swipe hint arrows (bottom left/right) */}
        {media.length > 1 && (
          <div className="sm:hidden absolute bottom-4 z-30 w-full flex justify-between px-4 pointer-events-none">
            <button
              onClick={prevSlide}
              className="pointer-events-auto min-w-10 min-h-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white/70 touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="pointer-events-auto min-w-10 min-h-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white/70 touch-manipulation"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
