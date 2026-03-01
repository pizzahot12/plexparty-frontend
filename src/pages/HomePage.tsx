import React, { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { HeroCarousel } from '@/components/Home/HeroCarousel';
import { MediaCarousel } from '@/components/Home/MediaCarousel';
import { useMedia } from '@/hooks/useMedia';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    movies, 
    series, 
    trending, 
    continueWatching,
    getByGenre 
  } = useMedia();

  const actionMovies = getByGenre('Acción').slice(0, 10);
  const dramaMovies = getByGenre('Drama').slice(0, 10);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="lg:ml-20 xl:ml-64 pt-16">
        {/* Hero */}
        <HeroCarousel media={trending.slice(0, 5)} className="mb-8" />

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
          {/* Continue watching */}
          {continueWatching.length > 0 && (
            <MediaCarousel
              title="Continuar viendo"
              media={continueWatching}
              showViewAll={false}
            />
          )}

          {/* Trending */}
          <MediaCarousel
            title="Tendencias"
            media={trending}
            onViewAll={() => navigate('/movies')}
          />

          {/* Action movies */}
          {actionMovies.length > 0 && (
            <MediaCarousel
              title="Acción"
              media={actionMovies}
              onViewAll={() => navigate('/movies')}
            />
          )}

          {/* Drama */}
          {dramaMovies.length > 0 && (
            <MediaCarousel
              title="Drama"
              media={dramaMovies}
              onViewAll={() => navigate('/movies')}
            />
          )}

          {/* Movies */}
          <MediaCarousel
            title="Películas populares"
            media={movies.slice(0, 10)}
            onViewAll={() => navigate('/movies')}
          />

          {/* Series */}
          <MediaCarousel
            title="Series populares"
            media={series.slice(0, 10)}
            onViewAll={() => navigate('/series')}
          />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
