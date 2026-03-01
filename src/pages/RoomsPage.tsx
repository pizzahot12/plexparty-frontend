import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';

import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Users, 
  X, 
  Power,
  DoorOpen,
  Crown,
  Lock,
  Globe,
  Clock,
  Film,
  Tv
} from 'lucide-react';

interface Room {
  id: string;
  code: string;
  name: string;
  mediaTitle: string;
  mediaPoster: string;
  mediaType: 'movie' | 'series';
  hostName: string;
  hostAvatar: string;
  participantCount: number;
  maxParticipants: number;
  isPrivate: boolean;
  createdAt: string;
  isHost?: boolean;
}

// Mock rooms data
const mockRooms: Room[] = [
  {
    id: 'room-1',
    code: 'ABC123',
    name: 'Sala de María',
    mediaTitle: 'El Padrino',
    mediaPoster: 'https://picsum.photos/seed/movie1/300/450',
    mediaType: 'movie',
    hostName: 'María García',
    hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    participantCount: 3,
    maxParticipants: 5,
    isPrivate: true,
    createdAt: 'Hace 5 min',
    isHost: false,
  },
  {
    id: 'room-2',
    code: 'DEF456',
    name: 'Noche de series',
    mediaTitle: 'Breaking Bad',
    mediaPoster: 'https://picsum.photos/seed/series1/300/450',
    mediaType: 'series',
    hostName: 'Carlos López',
    hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    participantCount: 2,
    maxParticipants: 4,
    isPrivate: false,
    createdAt: 'Hace 15 min',
    isHost: false,
  },
  {
    id: 'room-3',
    code: 'GHI789',
    name: 'Mi sala',
    mediaTitle: 'Inception',
    mediaPoster: 'https://picsum.photos/seed/movie2/300/450',
    mediaType: 'movie',
    hostName: 'Tú',
    hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
    participantCount: 1,
    maxParticipants: 6,
    isPrivate: true,
    createdAt: 'Hace 1 hora',
    isHost: true,
  },
];

const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showSuccess, showInfo } = useNotifications();
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [filter, setFilter] = useState<'all' | 'mine' | 'public'>('all');

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'mine') return room.isHost;
    if (filter === 'public') return !room.isPrivate;
    return true;
  });

  const handleJoinRoom = (roomCode: string) => {
    navigate(`/watch/${roomCode}`);
  };

  const handleCloseRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room && room.participantCount > 1) {
      showInfo('No se puede cerrar', 'Hay personas viendo en esta sala');
      return;
    }
    setRooms(rooms.filter((r) => r.id !== roomId));
    showSuccess('Sala cerrada', 'La sala ha sido cerrada correctamente');
  };

  const handleCloseAllRooms = () => {
    const myRooms = rooms.filter((r) => r.isHost);
    if (myRooms.length === 0) {
      showInfo('No tienes salas', 'No hay salas para cerrar');
      return;
    }
    setRooms(rooms.filter((r) => !r.isHost));
    showSuccess('Salas cerradas', 'Todas tus salas han sido cerradas');
  };

  const myRoomsCount = rooms.filter((r) => r.isHost).length;

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
              <h1 className="text-3xl font-bold text-white">Salas</h1>
              <p className="text-white/60 mt-1">
                {filteredRooms.length} {filteredRooms.length === 1 ? 'sala activa' : 'salas activas'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter tabs */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filter === 'all'
                      ? 'bg-[#ff6b35] text-white'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('mine')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filter === 'mine'
                      ? 'bg-[#ff6b35] text-white'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  Mías
                </button>
                <button
                  onClick={() => setFilter('public')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filter === 'public'
                      ? 'bg-[#ff6b35] text-white'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  Públicas
                </button>
              </div>

              {/* Close all button */}
              {myRoomsCount > 0 && (
                <button
                  onClick={handleCloseAllRooms}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  <Power className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Cerrar todas</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rooms grid */}
        <div className="px-4 sm:px-6 lg:px-8 pb-12">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <DoorOpen className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-white text-xl font-medium mb-2">No hay salas activas</h3>
              <p className="text-white/50 mb-6">Crea una sala o únete a una existente</p>
              <Button
                variant="primary"
                onClick={() => navigate('/movies')}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Crear sala
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300"
                >
                  {/* Media preview */}
                  <div className="relative aspect-video">
                    <img
                      src={room.mediaPoster}
                      alt={room.mediaTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                    
                    {/* Privacy badge */}
                    <div className="absolute top-3 left-3">
                      <span className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                        room.isPrivate
                          ? 'bg-black/50 text-white/80'
                          : 'bg-green-500/20 text-green-400'
                      )}>
                        {room.isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        {room.isPrivate ? 'Privada' : 'Pública'}
                      </span>
                    </div>

                    {/* Host badge */}
                    {room.isHost && (
                      <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium">
                          <Crown className="w-3 h-3" />
                          Host
                        </span>
                      </div>
                    )}

                    {/* Media info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 mb-1">
                        {room.mediaType === 'movie' ? (
                          <Film className="w-4 h-4 text-[#ff6b35]" />
                        ) : (
                          <Tv className="w-4 h-4 text-[#ff6b35]" />
                        )}
                        <span className="text-white/60 text-xs capitalize">
                          {room.mediaType === 'movie' ? 'Película' : 'Serie'}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold truncate">{room.mediaTitle}</h3>
                    </div>
                  </div>

                  {/* Room info */}
                  <div className="p-4">
                    {/* Room name and code */}
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">{room.name}</h4>
                      <code className="px-2 py-1 bg-white/10 rounded text-xs text-white/70 font-mono">
                        {room.code}
                      </code>
                    </div>

                    {/* Host info */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={room.hostAvatar}
                        alt={room.hostName}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-sm truncate">{room.hostName}</p>
                        <p className="text-white/40 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {room.createdAt}
                        </p>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                        <Users className="w-4 h-4 text-white/50" />
                        <span className="text-white/70 text-sm">
                          {room.participantCount}/{room.maxParticipants}
                        </span>
                      </div>
                      {/* Participant avatars */}
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(room.participantCount, 3) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff8555] border-2 border-[#1a1a1a]"
                          />
                        ))}
                        {room.participantCount > 3 && (
                          <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-[#1a1a1a] flex items-center justify-center">
                            <span className="text-white/60 text-xs">+{room.participantCount - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinRoom(room.code)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6b35] text-white font-medium rounded-xl hover:bg-[#ff8555] transition-colors"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Unirse
                      </button>
                      
                      {room.isHost && (
                        <button
                          onClick={() => handleCloseRoom(room.id)}
                          className="px-3 py-2.5 bg-white/10 text-white/70 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors"
                          title="Cerrar sala"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RoomsPage;
