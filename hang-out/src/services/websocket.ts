import { UserProfile, ChatMessage, BattleState } from '../types';
import { backendWebSocketUrl } from './backend';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectInterval: number = 3000;
  private isConnecting: boolean = false;
  private activeRoomId: string | null = null;
  private savedProfile: UserProfile | null = null;

  public connect(profile: UserProfile | null) {
    if (profile) this.savedProfile = profile;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      if (profile && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'REGISTER_USER', profile });
      }
      return;
    }

    this.isConnecting = true;
    const wsUrl = backendWebSocketUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        if (this.savedProfile) {
          this.send({ type: 'REGISTER_USER', profile: this.savedProfile });
        }
        if (this.activeRoomId) {
          this.joinRoom(this.activeRoomId, this.savedProfile);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.forEach((handler) => handler(data));
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.socket = null;
        setTimeout(() => {
          if (this.savedProfile) this.connect(this.savedProfile);
        }, this.reconnectInterval);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        this.socket?.close();
      };
    } catch (e) {
      this.isConnecting = false;
      console.error('WebSocket setup error:', e);
    }
  }

  public subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('Socket not open, message queued or dropped:', data);
    }
  }

  public joinRoom(roomId: string, profile: UserProfile | null) {
    this.activeRoomId = roomId;
    if (profile) this.savedProfile = profile;
    this.send({ type: 'JOIN_ROOM', roomId, profile: this.savedProfile });
  }

  public sendChatMessage(roomId: string, message: Partial<ChatMessage>) {
    this.send({
      type: 'SEND_CHAT_MESSAGE',
      roomId,
      message,
    });
  }

  public updateSharedPad(roomId: string, content: string, user: UserProfile) {
    this.send({
      type: 'UPDATE_SHARED_PAD',
      roomId,
      content,
      user,
    });
  }

  public enterMatchmaking(tier: 'Flow' | 'Fluent' | 'Fanatic', user: UserProfile) {
    this.send({
      type: 'ENTER_MATCHMAKING',
      tier,
      user,
    });
  }

  public cancelMatchmaking(tier: 'Flow' | 'Fluent' | 'Fanatic', userId: string) {
    this.send({
      type: 'CANCEL_MATCHMAKING',
      tier,
      userId,
    });
  }

  public submitBattleVerse(battleId: string, verseText: string, author: UserProfile, audioUrl?: string) {
    this.send({
      type: 'SUBMIT_BATTLE_VERSE',
      battleId,
      verseText,
      author,
      audioUrl,
    });
  }

  public spectatorVote(battleId: string, voteForPlayerId: string, userId: string) {
    this.send({
      type: 'SPECTATOR_VOTE',
      battleId,
      voteForPlayerId,
      userId,
    });
  }
}

export const wsService = new WebSocketService();
