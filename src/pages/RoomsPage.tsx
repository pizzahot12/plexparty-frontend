import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/Common/Button';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api-service';
import { useAuthStore } from '@/stores/authStore';
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
  Tv,
  RefreshCw
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
  isPrivate: boolean;
  createdAt: string;
  isHost?: boolean;
}

const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  useAuthStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showSuccess, showInfo, showError } = useNotifications();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | 'public'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch rooms from API
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      // For now, we'll use a mock approach since the backend might not have an endpoint to list all rooms
      // In a real scenario, you'd have an endpoint like /api/rooms/list
      // For now, we'll show empty state or allow users to join by code
      setRooms([]);
    } catch (error) {
      showError('Error', 'No se pudieron cargar las salas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'mine') return room.isHost;
    if (filter === 'public') return !room.isPrivate;
    return true;
  });

  const handleJoinRoom = async (roomCode: string) => {
    try {
      const room = await apiService.getRoomByCode(roomCode);
      if (room) {
        navigate(`/watch/${roomCode}`);
      }
    } catch (error) {
      showError('Error', 'No se pudo unir a la sala. Verifica el código.');
    }
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
              {/* Refresh button */}
              <button
                onClick={fetchRooms}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/70 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                <span className="hidden sm:inline text-sm">Actualizar</span>
              </button>

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

        {/* Join Room by Code Section */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <JoinRoomByCode onJoin={handleJoinRoom} />
        </div>

        {/* Rooms grid */}
        <div className="px-4 sm:px-6 lg:px-8 pb-12">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <DoorOpen className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-white text-xl font-medium mb-2">No hay salas activas</h3>
              <p className="text-white/50 mb-6">Crea una sala desde una película o serie, o únete usando un código</p>
              <Button
                variant="primary"
                onClick={() => navigate('/movies')}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Explorar películas
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
                          {room.participantCount} participantes
                        </span>
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

// Join Room by Code Component
const JoinRoomByCode: React.FC<{ onJoin: (code: string) => void }> = ({ onJoin }) => {
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) return;
    
    setIsJoining(true);
    await onJoin(code.trim().toUpperCase());
    setIsJoining(false);
    setCode('');
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">Unirse a una sala</h3>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Introduce el código (6 caracteres)"
          maxLength={6}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35] uppercase tracking-wider"
        />
        <button
          type="submit"
          disabled={code.trim().length !== 6 || isJoining}
          className="px-6 py-3 bg-[#ff6b35] text-white font-medium rounded-xl hover:bg-[#ff8555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Uniendo...' : 'Unirse'}
        </button>
      </form>
    </div>
  );
};

export default RoomsPage;
