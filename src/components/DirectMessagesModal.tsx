import React, { useEffect, useRef, useState } from "react";
import { X, Send, Mic, Square } from "lucide-react";
import { RegisteredUser } from "../services/authService";
import {
  DmContact,
  DmMessage,
  loadDmContacts,
  loadConversation,
  sendDmMessage,
} from "../services/dmService";

export const DirectMessagesContent: React.FC<{
  currentUser: RegisteredUser;
  onClose?: () => void;
}> = ({ currentUser, onClose }) => {
  const [contacts, setContacts] = useState<DmContact[]>([]),
    [peer, setPeer] = useState(""),
    [recipient, setRecipient] = useState("");
  const [messages, setMessages] = useState<DmMessage[]>([]),
    [content, setContent] = useState(""),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [recording, setRecording] = useState(false),
    [audio, setAudio] = useState<string>();
  const recorder = useRef<MediaRecorder | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    revision = useRef(0),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setPeer("");
    setMessages([]);
    setContacts([]);
    setAudio(undefined);
    setContent("");
    const refresh = () =>
      loadDmContacts()
        .then((list) => {
          if (!cancelled) setContacts(list);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    void refresh();
    const interval = setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser.id]);
  useEffect(() => {
    const version = ++revision.current;
    setMessages([]);
    if (!peer) return;
    const refresh = () =>
      loadConversation(peer)
        .then((data) => {
          if (version === revision.current) {
            setMessages(data.messages);
            setError("");
            setContacts((prev) =>
              prev.some((c) => c.id === peer) ? prev : [...prev, data.contact],
            );
          }
        })
        .catch((e) => {
          if (version === revision.current) setError(e.message);
        });
    void refresh();
    const interval = setInterval(refresh, 5000);
    return () => {
      revision.current++;
      clearInterval(interval);
    };
  }, [peer, currentUser.id]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peer || busy || (!content.trim() && !audio)) return;
    setBusy(true);
    setError("");
    const target = peer;
    const version = revision.current;
    try {
      const message = await sendDmMessage(target, content, audio);
      if (version === revision.current) {
        setMessages((old) =>
          old.some((m) => m.id === message.id) ? old : [...old, message],
        );
        setContent("");
        setAudio(undefined);
      }
      await loadDmContacts().then(setContacts);
    } catch (e: any) {
      if (version === revision.current) setError(e.message);
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const record = async () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    setError("");
    const version = revision.current;
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current || version !== revision.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const mime = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const r = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        audioBitsPerSecond: 64000,
      });
      recorder.current = r;
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        stream!.getTracks().forEach((t) => t.stop());
        clearTimeout(timer.current);
        if (!alive.current) return;
        setRecording(false);
        if (version !== revision.current) return;
        const blob = new Blob(chunks, { type: r.mimeType });
        if (blob.size > 500000) {
          setError("Voice message is too large. Record a shorter message.");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (alive.current && version === revision.current)
            setAudio(String(reader.result));
        };
        reader.readAsDataURL(blob);
      };
      r.start();
      setRecording(true);
      timer.current = setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 50000);
    } catch {
      stream?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      setError("Microphone access failed. No voice message was recorded.");
    }
  };
  return (
    <section
      className="h-full flex flex-col rounded-2xl border border-slate-700 bg-slate-950 text-white p-4"
      aria-label="Direct messages"
    >
      <header className="flex justify-between">
        <h2 className="font-bold text-lg">Direct messages</h2>
        {onClose && (
          <button aria-label="Close messages" onClick={onClose}>
            <X />
          </button>
        )}
      </header>
      <p className="text-xs text-slate-400 mt-2">
        Your account ID: <span className="select-all">{currentUser.id}</span>.
        Share it with collaborators. Conversations and voice notes are saved
        privately.
      </p>
      <div className="flex gap-2 my-3">
        <input
          className="flex-1 rounded bg-slate-800 p-2"
          aria-label="Recipient account ID"
          placeholder="Recipient account ID"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <button
          onClick={() => {
            setPeer(recipient.trim());
            setAudio(undefined);
            setContent("");
          }}
        >
          Open
        </button>
      </div>
      <div className="flex min-h-0 flex-1 gap-3">
        <aside className="w-1/3 overflow-auto">
          {contacts.length === 0 && (
            <p className="text-slate-400 text-sm">No conversations yet.</p>
          )}
          {contacts.map((c) => (
            <button
              className={`block w-full p-2 text-left rounded ${peer === c.id ? "bg-slate-700" : "bg-slate-900"}`}
              key={c.id}
              onClick={() => {
                setPeer(c.id);
                setAudio(undefined);
                setContent("");
              }}
            >
              {c.name}
              <span className="block text-xs text-slate-400">
                {c.lastMessageSnippet}
              </span>
            </button>
          ))}
        </aside>
        <div className="flex-1 overflow-auto space-y-3">
          {!peer && (
            <p className="text-slate-400">Choose a collaborator to begin.</p>
          )}
          {messages.map((m) => (
            <article
              key={m.id}
              className={`p-3 rounded-xl ${m.senderId === currentUser.id ? "bg-amber-950" : "bg-slate-800"}`}
            >
              <p className="text-xs text-slate-400">{m.senderName}</p>
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
              {m.audioUrl && (
                <audio controls src={m.audioUrl} className="max-w-full" />
              )}
            </article>
          ))}
        </div>
      </div>
      <p role="status" className="text-amber-300 text-sm my-2">
        {error || (recording ? "Recording—maximum 50 seconds." : "")}
      </p>
      {audio && (
        <div className="flex items-center gap-2">
          <audio controls src={audio} />
          <button onClick={() => setAudio(undefined)}>Discard</button>
        </div>
      )}
      <form onSubmit={send} className="flex gap-2">
        <button
          type="button"
          aria-label={recording ? "Stop recording" : "Record voice message"}
          disabled={!peer || busy}
          onClick={record}
        >
          {recording ? <Square /> : <Mic />}
        </button>
        <input
          aria-label="Message"
          maxLength={4000}
          disabled={!peer || busy}
          className="flex-1 rounded bg-slate-800 p-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button aria-label="Send message" disabled={!peer || busy || recording}>
          <Send />
        </button>
      </form>
    </section>
  );
};
export const DirectMessagesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentUser: RegisteredUser;
}> = ({ isOpen, onClose, currentUser }) =>
  !isOpen ? null : (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-4xl h-[650px] max-h-[90vh]">
        <DirectMessagesContent
          key={currentUser.id}
          currentUser={currentUser}
          onClose={onClose}
        />
      </div>
    </div>
  );
