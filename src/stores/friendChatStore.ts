import { create } from 'zustand';

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    type?: 'text' | 'invite';
    roomCode?: string;
}

interface FriendChatState {
    activeChatFriendId: string | null;
    messagesByFriend: Record<string, ChatMessage[]>;
}

interface FriendChatStore extends FriendChatState {
    openChat: (friendId: string) => void;
    closeChat: () => void;
    addMessage: (friendId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    receiveInvite: (friendId: string, roomCode: string) => void;
}

export const useFriendChatStore = create<FriendChatStore>((set, get) => ({
    activeChatFriendId: null,
    messagesByFriend: {},

    openChat: (friendId) => set({ activeChatFriendId: friendId }),
    closeChat: () => set({ activeChatFriendId: null }),

    addMessage: (friendId, message) => {
        const newMessage: ChatMessage = {
            ...message,
            id: `msg-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
        };

        set((state) => {
            const existing = state.messagesByFriend[friendId] || [];
            return {
                messagesByFriend: {
                    ...state.messagesByFriend,
                    [friendId]: [...existing, newMessage],
                }
            };
        });
    },

    receiveInvite: (friendId, roomCode) => {
        get().addMessage(friendId, {
            senderId: friendId,
            text: '¡Te he invitado a ver un video conmigo!',
            type: 'invite',
            roomCode
        });
    }
}));
