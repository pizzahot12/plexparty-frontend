import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useFriends } from '@/hooks/useFriends';
import { useFriendChatStore } from '@/stores/friendChatStore';
import { Send, Smile } from 'lucide-react';

export const FriendsChatWidget: React.FC = () => {
    const { user } = useAuth();
    const { friends } = useFriends();
    const { showSuccess, showError } = useNotifications();
    const { activeChatFriendId, closeChat, messagesByFriend, addMessage } = useFriendChatStore();
    const [inputText, setInputText] = useState('');
    const navigate = useNavigate();

    if (!activeChatFriendId) return null;

    const friend = friends.find(f => f.id === activeChatFriendId);
    const messages = messagesByFriend[activeChatFriendId] || [];

    if (!friend) return null;

    const handleSend = () => {
        if (!inputText.trim() || !user) return;
        addMessage(friend.id, {
            senderId: user.id,
            text: inputText.trim(),
        });
        setInputText('');
    };

    const handleAcceptInvite = (roomCode: string) => {
        navigate(`/watch/${roomCode}`);
        closeChat();
    };

    return (
        <div className="fixed inset-x-0 bottom-0 h-96 bg-[#1a1a1a] border-t border-white/10 z-[100] sm:right-8 sm:left-auto sm:w-80 sm:rounded-t-xl sm:border-x">
            <div className="h-full flex flex-col">
                {/* Chat header */}
                <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#242424] sm:rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <img
                                src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                                alt={friend.name}
                                className="w-8 h-8 rounded-full bg-white/10"
                            />
                            {friend.isOnline && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#242424]" />
                            )}
                        </div>
                        <span className="text-white font-medium text-sm">{friend.name}</span>
                    </div>
                    <button
                        onClick={closeChat}
                        className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="text-center text-white/40 text-sm py-8">
                            Inicia una conversación con {friend.name}
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isMe = message.senderId === user?.id;

                            if (message.type === 'invite') {
                                return (
                                    <div key={message.id} className="bg-[#ff6b35]/20 border border-[#ff6b35]/30 rounded-xl p-3 text-center">
                                        <p className="text-sm text-[#ff6b35] mb-2">{message.text}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => message.roomCode && handleAcceptInvite(message.roomCode)}
                                                className="flex-1 py-1 px-2 bg-[#ff6b35] text-white text-xs font-medium rounded-lg hover:bg-[#ff8555] transition-colors"
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                onClick={() => showSuccess('Rechazado', 'Invitación ignorada')}
                                                className="flex-1 py-1 px-2 bg-white/10 text-white/70 text-xs font-medium rounded-lg hover:bg-white/20 transition-colors"
                                            >
                                                Ignorar
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={message.id} className={cn('flex flex-col max-w-[80%]', isMe ? 'self-end items-end ml-auto' : 'self-start items-start')}>
                                    <div className={cn(
                                        'px-3 py-2 rounded-2xl text-sm',
                                        isMe ? 'bg-[#ff6b35] text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'
                                    )}>
                                        {message.text}
                                    </div>
                                    <span className="text-[10px] text-white/30 mt-1">
                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Chat input */}
                <div className="p-3 border-t border-white/10 bg-[#242424]">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Mensaje..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#ff6b35]/50"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSend();
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            className="p-1.5 bg-[#ff6b35] text-white rounded-xl hover:bg-[#ff8555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
