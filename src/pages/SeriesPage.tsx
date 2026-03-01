import React, { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MediaCard } from '@/components/Home/MediaCard';
import { useMedia } from '@/hooks/useMedia';
import { useNavigate } from 'react-router-dom';
import { Filter, Grid3X3, List, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const SeriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { series, getByGenre } = useMedia();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const genres = ['Todos', 'Drama', 'Ciencia Ficción', 'Acción', 'Comedia', 'Terror', 'Misterio'];
  
  const filteredSeries = selectedGenre && selectedGenre !== 'Todos'
    ? getByGenre(selectedGenre)
    : series;

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-20 xl:ml-64 pt-16">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Series</h1>
              <p className="text-white/60 mt-1">{filteredSeries.length} series disponibles</p>
            </div>

            {/* Filters and view mode */}
            <div className="flex items-center gap-3">
              {/* Genre filter */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors',
                    showFilters
                      ? 'bg-[#ff6b35]/10 border-[#ff6b35]/50 text-[#ff6b35]'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">{selectedGenre || 'Todos'}</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
                </button>

                {showFilters && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFilters(false)}
                    />
                    <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-[#242424] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                      {genres.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => {
                            setSelectedGenre(genre === 'Todos' ? null : genre);
                            setShowFilters(false);
                          }}
                          className={cn(
                            'w-full px-4 py-3 text-left text-sm transition-colors',
                            (selectedGenre === genre || (genre === 'Todos' && !selectedGenre))
                              ? 'bg-[#ff6b35]/20 text-[#ff6b35]'
                              : 'text-white hover:bg-white/10'
                          )}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'grid'
                      ? 'bg-[#ff6b35] text-white'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'list'
                      ? 'bg-[#ff6b35] text-white'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Series grid */}
        <div className="px-4 sm:px-6 lg:px-8 pb-12">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredSeries.map((show) => (
                <MediaCard key={show.id} media={show} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSeries.map((show) => (
                <div
                  key={show.id}
                  onClick={() => navigate(`/details/${show.id}`)}
                  className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <img
                    src={show.poster}
                    alt={show.title}
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-lg">{show.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-white/60">
                      <span>{show.year}</span>
                      <span>{show.seasons?.length || 0} temporadas</span>
                      <span className="flex items-center gap-1">
                        ★ {show.rating}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm mt-2 line-clamp-2">{show.synopsis}</p>
                    <div className="flex gap-2 mt-3">
                      {show.genres.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-1 bg-white/10 rounded text-xs text-white/70"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredSeries.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/50 text-lg">No se encontraron series</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SeriesPage;
