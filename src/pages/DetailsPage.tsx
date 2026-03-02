import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { MovieDetails } from '@/components/Details/MovieDetails';
import { SeriesDetails } from '@/components/Details/SeriesDetails';
import { CreateRoomModal } from '@/components/Modals/CreateRoomModal';
import { JoinRoomModal } from '@/components/Modals/JoinRoomModal';
import { Loading } from '@/components/Common/Loading';
import { useMedia } from '@/hooks/useMedia';


const DetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { selectedMedia, isLoading, loadMediaDetails, setSelectedMedia, getMediaById } = useMedia();

  useEffect(() => {
    if (!id) return;
    const cached = getMediaById(id);
    if (cached) {
      setSelectedMedia(cached);
    }
    loadMediaDetails(id);
    return () => setSelectedMedia(null);
  }, [id]);

  if (isLoading && !selectedMedia) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loading text="Cargando detalles..." />
      </div>
    );
  }

  if (!selectedMedia) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-lg">Contenido no encontrado</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#ff8555] transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const isSeriesType = selectedMedia.type === 'series';

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-20 xl:ml-64 pt-16">
        {isSeriesType ? (
          <SeriesDetails media={selectedMedia} />
        ) : (
          <MovieDetails media={selectedMedia} />
        )}
      </main>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mediaId={selectedMedia.id}
        mediaTitle={selectedMedia.title}
        mediaPoster={selectedMedia.poster}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
};

export default DetailsPage;
