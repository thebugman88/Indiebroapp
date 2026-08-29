/**
 * Direct Message (DM) & Audio Messaging Service
 * Allows indie artists to send and receive text and voice note messages,
 * preview audio waves, manage conversations, and simulate replies from community creators.
 */

export interface DmMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  recipientId: string;
  type: 'text' | 'audio';
  content: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  timestamp: number;
  isRead: boolean;
}

export interface DmContact {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatarUrl: string;
  isOnline: boolean;
  lastMessageSnippet: string;
  lastMessageTime: number;
  unreadCount: number;
  primaryGenre: string;
  studioAura: string;
}

const DM_MESSAGES_KEY = 'ib_dm_messages_v2';

export const INITIAL_CONTACTS: DmContact[] = [
  {
    id: 'artist_marcus_wave',
    name: 'Marcus Wave',
    handle: 'marcuswave_la',
    role: 'Hip-Hop / Boom Bap Producer',
    avatarUrl: '',
    isOnline: true,
    lastMessageSnippet: 'Yo! Checked your catalog demo in Hit Analyzer — that hook velocity is crazy!',
    lastMessageTime: Date.now() - 1000 * 60 * 15,
    unreadCount: 1,
    primaryGenre: 'Hip-Hop / 90s Boom Bap',
    studioAura: 'gold',
  },
  {
    id: 'artist_luna_vibe',
    name: 'Luna Vibe',
    handle: 'lunalofi_beats',
    role: 'R&B / Soul Songwriter',
    avatarUrl: '',
    isOnline: true,
    lastMessageSnippet: 'Here is a 15-second vocal harmony idea for the chorus (Audio Memo attached)',
    lastMessageTime: Date.now() - 1000 * 60 * 45,
    unreadCount: 1,
    primaryGenre: 'R&B / Neo-Soul',
    studioAura: 'violet',
  },
  {
    id: 'artist_cipher_king',
    name: 'Cipher_King',
    handle: 'cipherking_uk',
    role: 'Grime & Drill Emcee',
    avatarUrl: '',
    isOnline: false,
    lastMessageSnippet: 'Ready for the next Rap Battle round whenever you host in Hang Out.',
    lastMessageTime: Date.now() - 1000 * 60 * 180,
    unreadCount: 0,
    primaryGenre: 'UK Drill / Grime',
    studioAura: 'cyan',
  },
  {
    id: 'artist_maya_stems',
    name: 'Maya Stems',
    handle: 'mayastems_audio',
    role: 'Mixing & Mastering Engineer',
    avatarUrl: '',
    isOnline: true,
    lastMessageSnippet: 'Got your split sheet verified in RoyaltyOps! All ISRC prefixes match clean.',
    lastMessageTime: Date.now() - 1000 * 60 * 360,
    unreadCount: 0,
    primaryGenre: 'Pop / Synthwave',
    studioAura: 'emerald',
  },
];

export const INITIAL_DM_MESSAGES: DmMessage[] = [
  {
    id: 'msg_1',
    senderId: 'artist_marcus_wave',
    senderName: 'Marcus Wave',
    senderAvatar: '',
    senderRole: 'Producer',
    recipientId: 'admin_christopher_ray',
    type: 'text',
    content: 'Yo! Checked your catalog demo in Hit Analyzer — that hook velocity is crazy! Let me know if you want to collaborate on the stems.',
    timestamp: Date.now() - 1000 * 60 * 15,
    isRead: false,
  },
  {
    id: 'msg_2',
    senderId: 'artist_luna_vibe',
    senderName: 'Luna Vibe',
    senderAvatar: '',
    senderRole: 'Songwriter',
    recipientId: 'admin_christopher_ray',
    type: 'audio',
    content: 'Voice Note: 15s Vocal Hook Sketch (Key: F# Minor, 124 BPM)',
    audioUrl: 'https://cdn.freesound.org/previews/573/573381_5674468-lq.mp3',
    audioDurationSeconds: 14,
    timestamp: Date.now() - 1000 * 60 * 45,
    isRead: false,
  },
];

export function loadDmMessages(): DmMessage[] {
  if (typeof window === 'undefined') return INITIAL_DM_MESSAGES;
  try {
    const raw = localStorage.getItem(DM_MESSAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveDmMessages(INITIAL_DM_MESSAGES);
  return INITIAL_DM_MESSAGES;
}

export function saveDmMessages(messages: DmMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DM_MESSAGES_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('ib_dm_updated', { detail: messages }));
  } catch (e) {
    console.error('Failed to save DM messages:', e);
  }
}

export function sendDmMessage(message: Omit<DmMessage, 'id' | 'timestamp' | 'isRead'>): DmMessage {
  const newMsg: DmMessage = {
    ...message,
    id: `dm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    isRead: true,
  };

  const current = loadDmMessages();
  const updated = [...current, newMsg];
  saveDmMessages(updated);
  return newMsg;
}

export function markConversationAsRead(contactId: string, currentUserId: string): void {
  const current = loadDmMessages();
  let changed = false;
  const updated = current.map((m) => {
    if (m.senderId === contactId && m.recipientId === currentUserId && !m.isRead) {
      changed = true;
      return { ...m, isRead: true };
    }
    return m;
  });
  if (changed) {
    saveDmMessages(updated);
  }
}

export function getUnreadDmCount(currentUserId: string): number {
  const msgs = loadDmMessages();
  return msgs.filter((m) => m.recipientId === currentUserId && !m.isRead).length;
}
