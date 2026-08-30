import { getSuiteIdToken } from '../../../src/services/authService';
import { UserProfile, ChatMessage, BattleState } from '../types';
import { backendWebSocketUrl } from './backend';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectInterval: number = 3000;
  private isConnecting: boolean = false;
  private activeRoomId: string | null = null;
  private authenticated = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private savedProfile: UserProfile | null = null;

  public disconnect() {
    clearTimeout(this.reconnectTimer); this.savedProfile=null; this.authenticated=false;
    const old=this.socket; this.socket=null; old?.close();
  }
  public connect(profile: UserProfile | null) {
    if (!profile) { this.disconnect(); return; }
    this.savedProfile=profile;
    if (this.socket) return;
    const ws = new WebSocket(backendWebSocketUrl()); this.socket=ws;
    ws.onopen=async()=>{
      try { const token=await getSuiteIdToken(); if(this.socket===ws&&ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify({type:'AUTH',token})); }
      catch(e:any) { this.handlers.forEach(h=>h({type:'ERROR',message:e.message})); ws.close(); }
    };
    ws.onmessage=event=>{
      if(this.socket!==ws)return;
      try { const data=JSON.parse(event.data);
        if(data.type==='AUTH_OK'){this.authenticated=true;if(this.activeRoomId)this.joinRoom(this.activeRoomId,this.savedProfile);}
        this.handlers.forEach(h=>h(data));
      } catch { ws.close(); }
    };
    ws.onclose=event=>{
      if(this.socket!==ws)return;this.socket=null;this.authenticated=false;
      this.handlers.forEach(h=>h({type:'ERROR',message:event.code===4003?'Removed by a moderator.':'Disconnected from the room.'}));
      if(event.code!==4003)this.reconnectTimer=setTimeout(()=>{if(this.savedProfile)this.connect(this.savedProfile);},this.reconnectInterval);
    };
    ws.onerror=()=>ws.close();
  }

  public subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public send(data: any) {
    if (this.authenticated && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      if(data.type!=='JOIN_ROOM')this.handlers.forEach(h=>h({type:'ERROR',message:'Message was not sent. Wait for the room to connect.'}));
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
