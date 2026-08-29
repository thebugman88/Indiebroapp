import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Mic,
  Square,
  Play,
  Pause,
  Sparkles,
  Volume2,
  CheckCheck,
  User,
  Radio,
  Clock,
  Phone,
  Circle,
  MoreVertical,
} from 'lucide-react';
import {
  DmMessage,
  DmContact,
  INITIAL_CONTACTS,
  loadDmMessages,
  sendDmMessage,
  markConversationAsRead,
} from '../services/dmService';
import { RegisteredUser } from '../services/authService';

interface DirectMessagesContentProps {
  currentUser: RegisteredUser;
  onClose?: () => void;
}

export const DirectMessagesContent: React.FC<DirectMessagesContentProps> = ({ currentUser, onClose }) => {
  const [contacts, setContacts] = useState<DmContact[]>(INITIAL_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<DmContact>(INITIAL_CONTACTS[0]);
  const [messages, setMessages] = useState<DmMessage[]>(loadDmMessages);
  const [inputText, setInputText] = useState('');

  // Audio Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Audio Playback State
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark active chat as read
  useEffect(() => {
    if (selectedContact) {
      markConversationAsRead(selectedContact.id, currentUser.id);
      setMessages(loadDmMessages());
    }
  }, [selectedContact, currentUser.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Filter messages for current pair
  const currentChatMessages = messages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.recipientId === selectedContact.id) ||
      (m.senderId === selectedContact.id && m.recipientId === currentUser.id)
  );

  // Handle Send Text Message
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    const newMsg = sendDmMessage({
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatarUrl,
      senderRole: currentUser.role === 'admin' ? 'Master Admin' : 'Artist',
      recipientId: selectedContact.id,
      type: 'text',
      content: textToSend,
    });

    setMessages((prev) => [...prev, newMsg]);

    // Simulate smart artist response after a short pause
    setTimeout(() => {
      const replies = [
        `Love the energy on this! Let's lock in a session in Hang Out Collaboration room.`,
        `Got it! I'm loading up this idea in my DAW right now.`,
        `That sound selection is pure heat. Sending you stems shortly!`,
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];

      const simulatedReply = sendDmMessage({
        senderId: selectedContact.id,
        senderName: selectedContact.name,
        senderAvatar: selectedContact.avatarUrl,
        senderRole: selectedContact.role,
        recipientId: currentUser.id,
        type: 'text',
        content: replyText,
      });

      setMessages((prev) => [...prev, simulatedReply]);
    }, 1400);
  };

  // Start Voice Note Recording
  const startRecordingVoiceNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access unavailable, using simulated voice note memo:', err);
      // Fallback: create simulated voice note
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  // Stop Recording
  const stopRecordingVoiceNote = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    } else {
      // Fallback voice note sample URL
      setRecordedAudioUrl('https://cdn.freesound.org/previews/573/573381_5674468-lq.mp3');
    }
    setIsRecording(false);
  };

  // Send Recorded Voice Note
  const handleSendVoiceNote = () => {
    if (recordingSeconds === 0 && !recordedAudioUrl) return;

    const duration = recordingSeconds || 6;
    const finalUrl = recordedAudioUrl || 'https://cdn.freesound.org/previews/573/573381_5674468-lq.mp3';

    const newAudioMsg = sendDmMessage({
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatarUrl,
      senderRole: currentUser.role,
      recipientId: selectedContact.id,
      type: 'audio',
      content: `Voice Memo (${duration}s)`,
      audioUrl: finalUrl,
      audioDurationSeconds: duration,
    });

    setMessages((prev) => [...prev, newAudioMsg]);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);

    // Simulate smart audio reply
    setTimeout(() => {
      const simulatedAudioReply = sendDmMessage({
        senderId: selectedContact.id,
        senderName: selectedContact.name,
        senderAvatar: selectedContact.avatarUrl,
        senderRole: selectedContact.role,
        recipientId: currentUser.id,
        type: 'audio',
        content: `Voice Memo Response: Harmony Idea (8s)`,
        audioUrl: 'https://cdn.freesound.org/previews/573/573381_5674468-lq.mp3',
        audioDurationSeconds: 8,
      });
      setMessages((prev) => [...prev, simulatedAudioReply]);
    }, 1800);
  };

  // Play / Pause Message Audio
  const handleTogglePlayAudio = (msg: DmMessage) => {
    if (!msg.audioUrl) return;

    if (playingMsgId === msg.id) {
      audioPlayerRef.current?.pause();
      setPlayingMsgId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(msg.audioUrl);
    audio.play().catch((e) => console.warn('Play prevented:', e));
    audio.onended = () => setPlayingMsgId(null);
    audioPlayerRef.current = audio;
    setPlayingMsgId(msg.id);
  };

  return (
    <div className="w-full h-full min-h-[480px] max-h-[650px] rounded-3xl border border-amber-500/30 bg-slate-950 shadow-2xl overflow-hidden flex flex-col md:flex-row">
      {/* LEFT COLUMN: CONTACTS LIST */}
      <div className="w-full md:w-80 border-r border-slate-800/80 bg-slate-900/60 flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Direct Messages</h3>
              <span className="text-[10px] text-slate-400">Online Indie Artists</span>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {contacts.map((contact) => {
            const isSelected = selectedContact.id === contact.id;
            return (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-3 rounded-2xl text-left transition flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border border-amber-500/30 text-white'
                    : 'hover:bg-slate-900/80 text-slate-300'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={contact.avatarUrl}
                    alt={contact.name}
                    className="h-10 w-10 rounded-xl object-cover border border-slate-700"
                  />
                  {contact.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{contact.name}</span>
                    <span className="text-[9px] text-slate-500">Live</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{contact.role}</p>
                  <p className="text-[10px] text-amber-400/90 truncate mt-0.5">{contact.lastMessageSnippet}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE CHAT CONVERSATION */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedContact.avatarUrl}
              alt={selectedContact.name}
              className="h-10 w-10 rounded-xl object-cover border border-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">{selectedContact.name}</h4>
                <span className="text-[10px] text-slate-400">(@{selectedContact.handle})</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <Circle className="h-2 w-2 fill-current" />
                <span>Online in Hang Out • {selectedContact.primaryGenre}</span>
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {currentChatMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const isAudioPlaying = playingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="h-7 w-7 rounded-lg object-cover border border-slate-800 mb-1"
                  />
                )}

                <div
                  className={`max-w-[75%] rounded-2xl p-3.5 text-xs ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 rounded-br-none shadow-md font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {/* AUDIO MESSAGE CARD */}
                  {msg.type === 'audio' ? (
                    <div className="flex items-center gap-3 py-1">
                      <button
                        onClick={() => handleTogglePlayAudio(msg)}
                        className={`h-9 w-9 rounded-full flex items-center justify-center transition shadow cursor-pointer ${
                          isAudioPlaying
                            ? isMe
                              ? 'bg-slate-950 text-amber-400 animate-pulse'
                              : 'bg-amber-400 text-slate-950 animate-pulse'
                            : isMe
                            ? 'bg-slate-950 text-white hover:bg-slate-900'
                            : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        }`}
                      >
                        {isAudioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="flex items-center gap-1">
                            <Volume2 className="h-3.5 w-3.5" />
                            Voice Memo
                          </span>
                          <span>{msg.audioDurationSeconds || 12}s</span>
                        </div>

                        {/* Sound wave visualizer bars */}
                        <div className="flex items-center gap-0.5 mt-1.5 h-4">
                          {[40, 70, 90, 60, 100, 50, 80, 45, 95, 70, 30, 60, 85, 40].map((h, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full ${
                                isMe ? 'bg-slate-950/70' : 'bg-amber-400'
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* TEXT MESSAGE */
                    <p className="leading-relaxed">{msg.content}</p>
                  )}

                  {/* Timestamp & Read Receipts */}
                  <div
                    className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${
                      isMe ? 'text-slate-900/80' : 'text-slate-500'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* AUDIO RECORDING ACTIVE BAR */}
        {isRecording && (
          <div className="px-4 py-3 bg-rose-950/80 border-t border-rose-500/40 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-rose-300">
                Recording Voice Note... ({recordingSeconds}s)
              </span>
            </div>
            <button
              onClick={stopRecordingVoiceNote}
              className="rounded-xl bg-rose-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop & Review
            </button>
          </div>
        )}

        {/* AUDIO READY TO SEND BAR */}
        {!isRecording && recordedAudioUrl && (
          <div className="px-4 py-3 bg-amber-950/60 border-t border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
              <Volume2 className="h-4 w-4" />
              Voice Note Ready ({recordingSeconds || 6}s)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRecordedAudioUrl(null);
                  setRecordingSeconds(0);
                }}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleSendVoiceNote}
                className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
              >
                Send Voice Note
              </button>
            </div>
          </div>
        )}

        {/* MESSAGE INPUT BAR */}
        <form onSubmit={handleSendText} className="p-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
          <button
            type="button"
            onClick={isRecording ? stopRecordingVoiceNote : startRecordingVoiceNote}
            className={`p-2.5 rounded-xl transition cursor-pointer ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950'
            }`}
            title="Record Voice Note / Audio DM"
          >
            <Mic className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${selectedContact.name} (Text or Mic)...`}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: RegisteredUser;
}

export const DirectMessagesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[650px] max-h-[90vh]">
        <DirectMessagesContent currentUser={currentUser} onClose={onClose} />
      </div>
    </div>
  );
};
