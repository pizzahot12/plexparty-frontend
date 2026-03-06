import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

import { Send, Smile, MoreVertical } from 'lucide-react';

interface ChatPanelProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  className,
  isOpen = true,
  onClose,
}) => {
  const { user } = useAuth();
  const { messages, messagesEndRef, sendMessage, formatTime, groupMessagesByDate } = useChat();
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!inputText.trim() || !user) return;
    
    const text = inputText.trim();
    
    // Auto-trigger floating reaction if message is exactly an emoji or has keywords
    const isSingleEmoji = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]{1,3}$/u.test(text);
    const hasLaughKeyword = /\b(jaja|haha|lol|lmao|xd)\b/i.test(text);
    
    if (isSingleEmoji) {
      const event = new CustomEvent('local_reaction', { detail: { emoji: text } });
      window.dispatchEvent(event);
    } else if (hasLaughKeyword) {
      const event = new CustomEvent('local_reaction', { detail: { emoji: '😂' } });
      window.dispatchEvent(event);
    }

    sendMessage(text);
    setInputText('');
  };

  const handleQuickReaction = (emoji: string) => {
    const event = new CustomEvent('local_reaction', { detail: { emoji } });
    window.dispatchEvent(event);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-focus input when panel opens (desktop only — on mobile would trigger keyboard)
  useEffect(() => {
    if (isOpen && inputRef.current && window.innerWidth >= 1024) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const messageGroups = groupMessagesByDate();

  if (!isOpen) return null;

  return (
    <div className={cn(
      'flex flex-col bg-[#1a1a1a] border-l border-white/10 h-full',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="text-white font-semibold">Chat</h3>
          <p className="text-white/50 text-sm">{messages.length} mensajes</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50">No hay mensajes aún</p>
            <p className="text-white/30 text-sm mt-1">¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="px-3 text-xs text-white/40">{group.date}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Messages in this group */}
              <div className="space-y-3">
                {group.messages.map((message, messageIndex) => {
                  const isMe = message.userId === user?.id;
                  const showAvatar = messageIndex === 0 || 
                    group.messages[messageIndex - 1].userId !== message.userId;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        isMe && 'flex-row-reverse'
                      )}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-8">
                        {showAvatar ? (
                          <img
                            src={message.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.userId}`}
                            alt={message.userName}
                            className="w-8 h-8 rounded-full bg-white/10"
                          />
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>

                      {/* Message content */}
                      <div className={cn(
                        'max-w-[70%]',
                        isMe && 'text-right'
                      )}>
                        {showAvatar && (
                          <p className="text-xs text-white/50 mb-1">
                            {message.userName}
                          </p>
                        )}
                        <div
                          className={cn(
                            'inline-block px-3 py-2 rounded-2xl text-sm',
                            isMe
                              ? 'bg-[#ff6b35] text-white rounded-br-md'
                              : 'bg-white/10 text-white rounded-bl-md'
                          )}
                        >
                          {message.text}
                        </div>
                        <p className="text-xs text-white/30 mt-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions Bar */}
      <div className="px-4 py-2 border-t border-white/10 flex items-center justify-around bg-black/20">
        {['😂', '😍', '🔥', '😱', '👏', '🍿'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleQuickReaction(emoji)}
            className="text-xl hover:scale-125 transition-transform p-1 hover:bg-white/10 rounded-full"
            title={`Enviar reacción ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35]/50"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              inputText.trim()
                ? 'bg-[#ff6b35] text-white hover:bg-[#ff8555]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
