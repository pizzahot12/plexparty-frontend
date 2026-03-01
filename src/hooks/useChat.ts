import { useCallback, useEffect, useRef } from 'react';
import { useRoomStore } from '@/stores/roomStore';

export const useChat = () => {
  const { messages, addMessage, clearMessages } = useRoomStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback((text: string, userId: string, userName: string, userAvatar?: string) => {
    if (!text.trim()) return;
    addMessage({ userId, userName, text: text.trim(), userAvatar });
  }, [addMessage]);

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatDate = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      });
    }
  }, []);

  const groupMessagesByDate = useCallback(() => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = formatDate(message.timestamp);
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  }, [messages, formatDate]);

  return {
    messages,
    messagesEndRef,
    sendMessage,
    clearMessages,
    scrollToBottom,
    formatTime,
    formatDate,
    groupMessagesByDate,
  };
};
