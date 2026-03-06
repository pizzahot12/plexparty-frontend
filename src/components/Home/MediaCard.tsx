import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMedia } from '@/hooks/useMedia';
import type { Media } from '@/types';
import { Play, Plus, Check, Star, Info } from 'lucide-react';

interface MediaCardProps {
  media: Media;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  variant = 'default',
  className,
}) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useMedia();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const favorite = isFavorite(media.id);

  const handleClick = () => {
    navigate(`/details/${media.id}`);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/details/${media.id}`);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(media.id);
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group relative flex-shrink-0 w-32 sm:w-40 cursor-pointer',
          className
        )}
      >
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-white/10 animate-pulse" />
          )}
          <img
            src={media.poster}
            alt={media.title}
            className={cn(
              'w-full h-full object-cover transition-all duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              'group-hover:scale-105'
            )}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-2 left-2 right-2">
              <button
                onClick={handlePlay}
                className="w-8 h-8 bg-[#ff6b35] rounded-full flex items-center justify-center hover:bg-[#ff8555] transition-colors"
              >
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </button>
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-white truncate">{media.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-white/60">{media.rating}</span>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group relative cursor-pointer rounded-2xl overflow-hidden',
          className
        )}
      >
        <div className="relative aspect-video">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-white/10 animate-pulse" />
          )}
          <img
            src={media.backdrop || media.poster}
            alt={media.title}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              'group-hover:scale-105'
            )}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/50 to-transparent" />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">
                  {media.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <span>{media.year}</span>
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {media.rating}
                  </span>
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  <span className="capitalize">{media.type === 'movie' ? 'Película' : 'Serie'}</span>
                </div>
                <p className="text-white/60 text-sm mt-2 line-clamp-2 max-w-xl hidden sm:block">
                  {media.synopsis}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleFavorite}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    favorite
                      ? 'bg-[#ff6b35] text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                >
                  {favorite ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
                <button
                  onClick={handlePlay}
                  className="w-12 h-12 bg-[#ff6b35] rounded-full flex items-center justify-center hover:bg-[#ff8555] transition-colors shadow-lg shadow-[#ff6b35]/25"
                >
                  <Play className="w-5 h-5 text-white fill-white ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative cursor-pointer',
        className
      )}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
        )}
        <img
          src={media.poster}
          alt={media.title}
          className={cn(
            'w-full h-full object-cover transition-all duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            isHovered && 'scale-105'
          )}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Hover/touch overlay — always visible on mobile, hover on desktop */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300',
          isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0 max-sm:opacity-100'
        )}>
          <div className="absolute inset-0 flex flex-col justify-end p-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handlePlay}
                className="w-10 h-10 bg-[#ff6b35] rounded-full flex items-center justify-center hover:bg-[#ff8555] transition-colors shadow-lg"
              >
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </button>
              <button
                onClick={handleFavorite}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-colors border-2',
                  favorite
                    ? 'bg-[#ff6b35] border-[#ff6b35] text-white'
                    : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                )}
              >
                {favorite ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/details/${media.id}`);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 transition-colors"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
            
            <h4 className="text-white font-medium text-sm line-clamp-1">{media.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" />
                {media.rating}
              </span>
              <span className="text-xs text-white/60">{media.year}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
