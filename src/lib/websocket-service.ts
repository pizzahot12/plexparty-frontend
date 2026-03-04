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
    // ── 1. Neutralize any existing socket so stale callbacks never fire ──────
    if (this.ws) {
      const stale = this.ws;
      stale.onopen = null;
      stale.onmessage = null;
      stale.onerror = null;
      stale.onclose = null; // prevents stale onclose from triggering attemptReconnect
      if (stale.readyState === WebSocket.OPEN || stale.readyState === WebSocket.CONNECTING) {
        stale.close();
      }
      this.ws = null;
    }

    // ── 2. Cancel any pending reconnect timer ────────────────────────────────
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    return new Promise((resolve, reject) => {
      const token = useAuthStore.getState().token;

      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.roomId = roomId;
      const wsUrl = `${WS_BASE_URL}/ws/rooms/${roomId}?token=${token}`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        if (this.ws !== ws) return; // stale — another connect() was called mid-flight
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      ws.onmessage = (event) => {
        if (this.ws !== ws) return; // stale
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          this.handleEvent(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        if (this.ws !== ws) return; // stale
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        if (this.ws !== ws) return; // stale — don't reconnect for an evicted socket
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
