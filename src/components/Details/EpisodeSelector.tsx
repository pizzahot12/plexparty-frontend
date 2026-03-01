import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Season } from '@/types';
import { Play, Clock, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface EpisodeSelectorProps {
  season: Season;
  onEpisodeSelect?: (episodeIndex: number) => void;
  watchedEpisodes?: number[];
  className?: string;
}

export const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  season,
  onEpisodeSelect,
  watchedEpisodes = [],
  className,
}) => {
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

  const toggleEpisode = (index: number) => {
    setExpandedEpisode(expandedEpisode === index ? null : index);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      {season.episodes.map((episode, index) => {
        const isWatched = watchedEpisodes.includes(index);
        const isExpanded = expandedEpisode === index;

        return (
          <div
            key={episode.id}
            className={cn(
              'group rounded-xl border transition-all duration-200 overflow-hidden',
              isExpanded
                ? 'bg-white/10 border-white/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            )}
          >
            {/* Episode header */}
            <button
              onClick={() => toggleEpisode(index)}
              className="w-full p-4 flex items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="relative flex-shrink-0 w-32 sm:w-40 aspect-video rounded-lg overflow-hidden bg-white/10">
                {episode.thumbnail ? (
                  <img
                    src={episode.thumbnail}
                    alt={episode.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-[#ff6b35] rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
                {isWatched && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Episode info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#ff6b35] font-medium text-sm">
                    E{episode.number.toString().padStart(2, '0')}
                  </span>
                  {isWatched && (
                    <span className="text-green-400 text-xs">Visto</span>
                  )}
                </div>
                <h4 className="text-white font-medium truncate">{episode.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-white/50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(episode.duration)}
                  </span>
                </div>
              </div>

              {/* Expand icon */}
              <div className="flex-shrink-0 text-white/50">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="pl-36 sm:pl-44">
                  <p className="text-white/70 text-sm leading-relaxed mb-4">
                    {episode.synopsis}
                  </p>
                  <button
                    onClick={() => onEpisodeSelect?.(index)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#ff6b35] text-white text-sm font-medium rounded-lg hover:bg-[#ff8555] transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Reproducir
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
