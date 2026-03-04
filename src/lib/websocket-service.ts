import { WS_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

type WebSocketEventType =
  | 'connection_established'
  | 'user_joined'
  | 'user_left'
  | 'play'
  | 'pause'
  | 'seek'
  | 'message'
  | 'user_kicked'
  | 'room_closed'
  | 'chat_message'
  | 'quality_changed';

interface WebSocketEvent {
  type: WebSocketEventType;
  [key: string]: unknown;
}

type EventHandler = (event: WebSocketEvent) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private eventHandlers: Map<WebSocketEventType, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Initialize event handlers map
    const eventTypes: WebSocketEventType[] = [
      'connection_established',
      'user_joined',
      'user_left',
      'play',
      'pause',
      'seek',
      'message',
      'user_kicked',
      'room_closed',
      'chat_message',
      'quality_changed',
    ];
    eventTypes.forEach((type) => {
      this.eventHandlers.set(type, []);
    });
  }

  connect(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = useAuthStore.getState().token;

      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.roomId = roomId;
      const wsUrl = `${WS_BASE_URL}/ws/rooms/${roomId}?token=${token}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          this.handleEvent(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.roomId = null;
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect

    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      // Only close if already open or connecting — swallow the race condition error
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        // Let it finish connecting, then close it. Suppress errors.
        ws.onopen = () => ws.close();
        ws.onerror = () => { };
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (!this.roomId) return;

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.roomId!).catch(() => {
        // Error handled in connect method
      });
    }, this.reconnectInterval);
  }

  private handleEvent(event: WebSocketEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  clearHandlers(): void {
    this.eventHandlers.forEach((_, key) => {
      this.eventHandlers.set(key, []);
    });
  }

  on(event: WebSocketEventType, handler: EventHandler): () => void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.push(handler);
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  send(event: Omit<WebSocketEvent, 'timestamp'>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Convenience methods
  play(currentTime: number): void {
    this.send({ type: 'play', currentTime });
  }

  pause(currentTime: number): void {
    this.send({ type: 'pause', currentTime });
  }

  seek(currentTime: number): void {
    this.send({ type: 'seek', currentTime });
  }

  sendMessage(text: string): void {
    this.send({ type: 'chat_message', text });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
