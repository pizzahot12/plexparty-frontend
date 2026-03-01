import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Media } from '@/types';
import { MediaCard } from './MediaCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaCarouselProps {
  title: string;
  media: Media[];
  className?: string;
  cardVariant?: 'default' | 'compact' | 'featured';
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  title,
  media,
  className,
  cardVariant = 'default',
  showViewAll = true,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  if (media.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {showViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-[#ff6b35] hover:text-[#ff8555] transition-colors flex items-center gap-1"
          >
            Ver todo
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#1a1a1a]/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300',
            canScrollLeft
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-4 pointer-events-none'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[#1a1a1a]/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300',
            canScrollRight
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-4 pointer-events-none'
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-4 lg:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              variant={cardVariant}
              className="flex-shrink-0 w-36 sm:w-44 md:w-52"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
