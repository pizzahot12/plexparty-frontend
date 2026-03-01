import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useFriends } from '@/hooks/useFriends';

import { FriendsCard } from './FriendsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, UserCheck, UserX } from 'lucide-react';

interface FriendsListProps {
  className?: string;
}

export const FriendsList: React.FC<FriendsListProps> = ({ className }) => {
  const { friends, onlineFriends, watchingFriends, requests } = useFriends();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOnline = onlineFriends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWatching = watchingFriends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        <input
          type="text"
          placeholder="Buscar amigos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35]/50"
        />
      </div>

      {/* Friend requests */}
      {requests.length > 0 && (
        <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-xl p-4">
          <h3 className="text-[#ff6b35] font-medium mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Solicitudes pendientes ({requests.length})
          </h3>
          <div className="space-y-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
              >
                <img
                  src={request.fromUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromUserId}`}
                  alt={request.fromUserName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-white font-medium">{request.fromUserName}</p>
                  <p className="text-white/50 text-xs">Quiere ser tu amigo</p>
                </div>
                <button className="px-3 py-1.5 bg-green-500/20 text-green-400 text-sm rounded-lg hover:bg-green-500/30 transition-colors">
                  Aceptar
                </button>
                <button className="px-3 py-1.5 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition-colors">
                  Rechazar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full bg-white/5 p-1 rounded-xl">
          <TabsTrigger
            value="all"
            className="flex-1 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white rounded-lg py-2 text-white/70 transition-colors"
          >
            <Users className="w-4 h-4 mr-2" />
            Todos ({filteredFriends.length})
          </TabsTrigger>
          <TabsTrigger
            value="online"
            className="flex-1 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white rounded-lg py-2 text-white/70 transition-colors"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            En línea ({filteredOnline.length})
          </TabsTrigger>
          <TabsTrigger
            value="watching"
            className="flex-1 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white rounded-lg py-2 text-white/70 transition-colors"
          >
            <div className="w-2 h-2 bg-[#ff6b35] rounded-full mr-2 animate-pulse" />
            Viendo ({filteredWatching.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFriends.map((friend) => (
              <FriendsCard key={friend.id} friend={friend} />
            ))}
          </div>
          {filteredFriends.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">No se encontraron amigos</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="online" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOnline.map((friend) => (
              <FriendsCard key={friend.id} friend={friend} />
            ))}
          </div>
          {filteredOnline.length === 0 && (
            <div className="text-center py-12">
              <UserX className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">Ningún amigo en línea</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="watching" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWatching.map((friend) => (
              <FriendsCard key={friend.id} friend={friend} showJoinButton />
            ))}
          </div>
          {filteredWatching.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-4 h-4 bg-[#ff6b35] rounded-full animate-pulse" />
              </div>
              <p className="text-white/50">Nadie está viendo ahora</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
