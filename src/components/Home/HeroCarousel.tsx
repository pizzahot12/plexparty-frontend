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

  // Shared dots renderer
  const progressDots = (
    <div className="flex items-center gap-2">
      {media.map((_, index) => (
        <button
          key={index}
          onClick={() => goToSlide(index)}
          className="relative h-1.5 rounded-full overflow-hidden bg-white/25 transition-all duration-300 touch-manipulation"
          style={{ width: index === currentIndex ? '32px' : '10px', minHeight: '20px' }}
          aria-label={`Ir a slide ${index + 1}`}
        >
          {index === currentIndex && (
            <div
              className="absolute inset-0 bg-[#ff6b35] rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          )}
          {index < currentIndex && (
            <div className="absolute inset-0 bg-[#ff6b35] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      <div className="relative min-h-[65vh] sm:min-h-0 sm:aspect-[21/9] sm:max-h-[70vh]">

        {/* ── Background slides (always absolute) ── */}
        {media.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            )}
          >
            <img
              src={item.backdrop || item.poster}
              alt={item.title}
              className={cn(
                'w-full h-full object-cover object-top',
                index === currentIndex && 'hero-kenburns'
              )}
            />
            {/* Side gradient (left readable zone) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/75 via-[#1a1a1a]/20 to-transparent" />
            {/* Bottom gradient (always dark for content legibility) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/35 to-transparent" />
          </div>
        ))}

        {/* ══════════════════════════════════════════
            MOBILE LAYOUT  (hidden on sm+)
            flex-col so nothing overlaps — content
            flows naturally above the nav row
            ══════════════════════════════════════════ */}
        <div className="sm:hidden absolute inset-0 z-20 flex flex-col justify-end">
          {/* Animated content block */}
          <div
            key={`mob-${currentIndex}`}
            className="px-4 pt-4 pb-3 hero-content-in"
          >
            {/* Genre pills */}
            <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto scrollbar-hide pb-0.5">
              {currentMedia.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="flex-shrink-0 px-2.5 py-0.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[11px] font-medium text-white/85"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-[1.6rem] font-bold text-white leading-tight line-clamp-2 drop-shadow-lg mb-1.5">
              {currentMedia.title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center gap-2.5 mb-2.5 text-xs text-white/75">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-white">{currentMedia.rating}</span>
              </span>
              <span className="w-0.5 h-3 bg-white/20 rounded-full" />
              <span>{currentMedia.year}</span>
              <span className="w-0.5 h-3 bg-white/20 rounded-full" />
              <span className="px-1.5 py-0.5 bg-[#ff6b35]/25 text-[#ff6b35] rounded-md text-[11px] font-semibold border border-[#ff6b35]/30">
                {currentMedia.type === 'movie' ? 'Película' : 'Serie'}
              </span>
            </div>

            {/* Synopsis */}
            {currentMedia.synopsis && (
              <p className="text-white/65 text-[13px] leading-relaxed mb-3.5 line-clamp-2">
                {currentMedia.synopsis}
              </p>
            )}

            {/* Primary action */}
            <button
              onClick={() => navigate(`/details/${currentMedia.id}`)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#ff6b35] text-white font-semibold rounded-xl hover:bg-[#ff8555] active:scale-[0.98] transition-all shadow-lg shadow-[#ff6b35]/30 mb-2 touch-manipulation"
            >
              <Play className="w-4 h-4 fill-white" />
              Ver ahora
            </button>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <button
                onClick={() => toggleFavorite(currentMedia.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-[0.98] touch-manipulation',
                  favorite
                    ? 'bg-[#ff6b35] border-[#ff6b35] text-white'
                    : 'bg-black/40 backdrop-blur-sm border-white/25 text-white'
                )}
              >
                {favorite ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {favorite ? 'En lista' : 'Agregar'}
              </button>
              <button
                onClick={() => navigate(`/details/${currentMedia.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-black/40 backdrop-blur-sm border border-white/25 text-white rounded-xl text-sm font-medium active:scale-[0.98] touch-manipulation"
              >
                <Info className="w-4 h-4" />
                Info
              </button>
            </div>
          </div>

          {/* ── Navigation row: [<] [dots] [>] — all in ONE row, no overlap ── */}
          {media.length > 1 && (
            <div className="flex items-center justify-between px-5 py-4 mt-1">
              <button
                onClick={prevSlide}
                className="w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-white/80 active:bg-white/20 touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {progressDots}

              <button
                onClick={nextSlide}
                className="w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-white/80 active:bg-white/20 touch-manipulation"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            DESKTOP LAYOUT  (hidden on mobile)
            Content centered vertically, side arrows
            ══════════════════════════════════════════ */}
        <div className="hidden sm:flex absolute inset-0 z-20 items-center">
          <div
            key={`dsk-${currentIndex}`}
            className="w-full max-w-7xl mx-auto px-8 lg:px-12 hero-content-in"
          >
            <div className="max-w-xl">
              {/* Genre pills */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide">
                {currentMedia.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="flex-shrink-0 px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full text-xs font-medium text-white/90"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-3 leading-tight line-clamp-2 drop-shadow-lg">
                {currentMedia.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-3 mb-4 text-sm text-white/75">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-white">{currentMedia.rating}</span>
                </span>
                <span className="w-0.5 h-4 bg-white/20 rounded-full" />
                <span>{currentMedia.year}</span>
                {currentMedia.duration && (
                  <>
                    <span className="w-0.5 h-4 bg-white/20 rounded-full" />
                    <span>{Math.floor(currentMedia.duration / 60)}h {currentMedia.duration % 60}m</span>
                  </>
                )}
                <span className="w-0.5 h-4 bg-white/20 rounded-full" />
                <span className="px-2 py-0.5 bg-[#ff6b35]/20 text-[#ff6b35] rounded text-xs font-semibold border border-[#ff6b35]/30">
                  {currentMedia.type === 'movie' ? 'Película' : 'Serie'}
                </span>
              </div>

              {/* Synopsis */}
              {currentMedia.synopsis && (
                <p className="text-white/70 text-sm lg:text-base mb-5 line-clamp-2 lg:line-clamp-3">
                  {currentMedia.synopsis}
                </p>
              )}

              {/* Actions — horizontal row on desktop */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/details/${currentMedia.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#ff6b35] text-white font-semibold rounded-xl hover:bg-[#ff8555] transition-colors shadow-lg shadow-[#ff6b35]/30"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Ver ahora
                </button>
                <button
                  onClick={() => toggleFavorite(currentMedia.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 rounded-xl font-medium border transition-colors',
                    favorite
                      ? 'bg-[#ff6b35] border-[#ff6b35] text-white'
                      : 'bg-black/40 backdrop-blur-sm border-white/25 text-white hover:bg-white/15'
                  )}
                >
                  {favorite ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {favorite ? 'En mi lista' : 'Agregar'}
                </button>
                <button
                  onClick={() => navigate(`/details/${currentMedia.id}`)}
                  className="flex items-center gap-2 px-5 py-3 bg-black/40 backdrop-blur-sm border border-white/25 text-white rounded-xl font-medium hover:bg-white/15 transition-colors"
                >
                  <Info className="w-5 h-5" />
                  Más info
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: side navigation arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-black/40 backdrop-blur-sm border border-white/15 rounded-full items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-black/40 backdrop-blur-sm border border-white/15 rounded-full items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Desktop: dots centered at bottom */}
        {media.length > 1 && (
          <div className="hidden sm:flex absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            {progressDots}
          </div>
        )}
      </div>
    </div>
  );
};
