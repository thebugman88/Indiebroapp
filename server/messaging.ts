import express from "express";
import { createHash, randomUUID } from "node:crypto";
import { getFirestore, FieldPath } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp, requireVerifiedEmail } from "./auth";
import { decodeAudioDataUrl, safeId, textField } from "./media";

export function conversationId(a: string, b: string) {
  return createHash("sha256")
    .update(JSON.stringify([a, b].sort()))
    .digest("hex");
}
export interface MessageStore {
  list(uid: string): Promise<any[]>;
  read(uid: string, peer: string): Promise<any[]>;
  send(
    uid: string,
    peer: string,
    message: any,
    names: Record<string, string>,
  ): Promise<void>;
}
const db = () => getFirestore(getFirebaseAdminApp());
export const firestoreMessages: MessageStore = {
  async list(uid) {
    const snapshot = await db()
      .collection("dmConversations")
      .where("members", "array-contains", uid)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const peer = data.members.find((member: string) => member !== uid);
      return {
        id: peer,
        name: data.names[peer] || "Artist",
        unreadCount: data.unread?.[uid] || 0,
        lastMessageSnippet: data.lastMessage,
        lastMessageTime: data.updatedAt,
      };
    });
  },
  async read(uid, peer) {
    const ref = db()
      .collection("dmConversations")
      .doc(conversationId(uid, peer));
    const snapshot = await ref.get();
    if (!snapshot.exists) return [];
    if (!snapshot.data()!.members.includes(uid))
      throw new Error("Conversation access denied.");
    const readAt = Date.now();
    const messages = await ref
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
    // Transaction preserves messages/unread increments that arrive after the read began.
    await db().runTransaction(async (t) => {
      const current = await t.get(ref);
      if ((current.data()?.updatedAt || 0) <= readAt)
        t.update(ref, new FieldPath("unread", uid), 0);
    });
    return messages.docs.map((doc) => doc.data()).reverse();
  },
  async send(uid, peer, message, names) {
    const ref = db()
      .collection("dmConversations")
      .doc(conversationId(uid, peer));
    await db().runTransaction(async (t) => {
      const current = await t.get(ref);
      const old = current.data();
      const timestamp = Date.now();
      t.create(ref.collection("messages").doc(message.id), {
        ...message,
        timestamp,
      });
      t.set(ref, {
        members: [uid, peer].sort(),
        names,
        updatedAt: timestamp,
        lastMessage:
          message.type === "audio"
            ? "Voice message"
            : message.content.slice(0, 160),
        unread: {
          ...(old?.unread || {}),
          [peer]: (old?.unread?.[peer] || 0) + 1,
        },
      });
    });
  },
};
export function createMessagingRouter(
  store: MessageStore = firestoreMessages,
  lookup = async (uid: string) => {
    const user = await getAuth(getFirebaseAdminApp()).getUser(uid);
    if (user.disabled || !user.emailVerified)
      throw new Error("Recipient is unavailable.");
    return { name: user.displayName || "Independent Artist" };
  },
) {
  const router = express.Router();
  router.use(requireVerifiedEmail);
  router.get("/contacts", async (_req, res) => {
    try {
      res.json({ contacts: await store.list(res.locals.identity.uid) });
    } catch {
      res.status(503).json({ error: "Messages could not be loaded." });
    }
  });
  router.get("/:peer", async (req, res) => {
    try {
      const peer = safeId(req.params.peer);
      const contact = await lookup(peer);
      const messages = await store.read(res.locals.identity.uid, peer);
      res.json({ contact: { id: peer, ...contact }, messages });
    } catch {
      res
        .status(400)
        .json({
          error:
            "Conversation could not be loaded. Check the recipient account ID.",
        });
    }
  });
  router.post("/:peer", async (req, res) => {
    const uid = res.locals.identity.uid;
    let peer: string;
    let content: string;
    let audioUrl: string | undefined;
    try {
      peer = safeId(req.params.peer);
      if (peer === uid) throw new Error("Choose another artist.");
      content = textField(
        req.body?.content || "",
        4000,
        req.body?.type !== "audio",
      );
      if (req.body?.type === "audio") {
        const audio = decodeAudioDataUrl(req.body.audioUrl, 500_000);
        audioUrl = `data:${audio.mimeType};base64,${audio.base64}`;
      } else if (req.body?.type !== "text")
        throw new Error("Unsupported message type.");
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
      return;
    }
    try {
      const recipient = await lookup(peer);
      const senderName = String(
        res.locals.identity.name || "Independent Artist",
      ).slice(0, 80);
      const message = {
        id: randomUUID(),
        senderId: uid,
        recipientId: peer,
        senderName,
        senderAvatar: "",
        senderRole: "Artist",
        type: audioUrl ? "audio" : "text",
        content,
        ...(audioUrl ? { audioUrl } : {}),
        timestamp: Date.now(),
        isRead: false,
      };
      await store.send(uid, peer, message, {
        [uid]: senderName,
        [peer]: recipient.name,
      });
      res.status(201).json({ message });
    } catch {
      res
        .status(503)
        .json({
          error:
            "Message was not confirmed as sent. Please retry after checking the conversation.",
        });
    }
  });
  return router;
}
