import { authenticatedFetch, getCurrentAuthUser } from "./authService";
export interface DmMessage {
  id: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  type: "text" | "audio";
  content: string;
  audioUrl?: string;
  timestamp: number;
  isRead: boolean;
}
export interface DmContact {
  id: string;
  name: string;
  unreadCount?: number;
  lastMessageSnippet?: string;
  lastMessageTime?: number;
}
let unread = 0;
async function request(path: string, init?: RequestInit) {
  const response = await authenticatedFetch(`/api/dm${path}`, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Messaging is unavailable.");
  return data;
}
export async function loadDmContacts(): Promise<DmContact[]> {
  const uid = getCurrentAuthUser().id;
  const { contacts } = await request("/contacts");
  if (uid !== getCurrentAuthUser().id) return [];
  unread = contacts.reduce(
    (sum: number, c: DmContact) => sum + (c.unreadCount || 0),
    0,
  );
  window.dispatchEvent(new CustomEvent("ib_dm_updated"));
  return contacts;
}
export async function loadConversation(
  peer: string,
): Promise<{ contact: DmContact; messages: DmMessage[] }> {
  return request(`/${encodeURIComponent(peer)}`);
}
export async function sendDmMessage(
  peer: string,
  content: string,
  audioUrl?: string,
): Promise<DmMessage> {
  const data = await request(`/${encodeURIComponent(peer)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: audioUrl ? "audio" : "text",
      content,
      audioUrl,
    }),
  });
  return data.message;
}
export function getUnreadDmCount(currentUserId: string): number {
  return currentUserId === getCurrentAuthUser().id ? unread : 0;
}
if (typeof window !== "undefined")
  window.addEventListener("ib_auth_changed", () => {
    unread = 0;
    window.dispatchEvent(new CustomEvent("ib_dm_updated"));
  });
