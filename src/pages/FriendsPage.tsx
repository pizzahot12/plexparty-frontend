import React, { useState } from 'react';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { FriendsList } from '@/components/Friends/FriendsList';
import { AddFriendForm } from '@/components/Friends/AddFriendForm';

const FriendsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-20 xl:ml-64 pt-16">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Amigos</h1>
            <p className="text-white/60 mt-1">Conecta con tus amigos y mira juntos</p>
          </div>

          {/* Add friend form */}
          <div className="max-w-xl mb-8">
            <AddFriendForm />
          </div>

          {/* Friends list */}
          <FriendsList />
        </div>
      </main>
    </div>
  );
};

export default FriendsPage;
