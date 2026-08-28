import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile } from '../../types';
import { MessageSquare, Send, Users, Sparkles, Radio, Flame, Shield } from 'lucide-react';

interface Props {
  currentUser: UserProfile | null;
  messages: ChatMessage[];
  roomUsers: UserProfile[];
  onSendMessage: (roomId: string, message: Partial<ChatMessage>) => void;
  onRequireNickname: () => void;
}

export const LoungeRoom: React.FC<Props> = ({
  currentUser,
  messages,
  roomUsers,
  onSendMessage,
  onRequireNickname,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireNickname();
      return;
    }
    if (!inputMessage.trim()) return;

    onSendMessage('lounge', {
      sender: currentUser,
      content: inputMessage.trim(),
      type: 'text',
    });
    setInputMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Lounge Hero Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 mb-2">
              <MessageSquare className="h-4 w-4" />
              CASUAL ARTIST LOUNGE
            </div>
            <h2 className="text-2xl font-black text-white">The Main Lounge Chat</h2>
            <p className="text-xs text-slate-300 mt-1">
              Kick back, plug your latest music releases, talk studio gear, discuss tour life, or just connect with fellow indie creators worldwide.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-slate-900 p-4 border border-slate-800">
            <Radio className="h-6 w-6 text-amber-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white">Live Community Stream</p>
              <p className="text-[10px] text-emerald-400">● {roomUsers.length > 0 ? roomUsers.length : 8} Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Lounge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Feed (3 cols) */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col h-[580px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs italic">
                Welcome to the Lounge! Drop a message to introduce yourself or share your latest project.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="rounded-2xl bg-slate-950 p-4 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={m.sender?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={m.sender?.nickname}
                        className="h-7 w-7 rounded-full object-cover border border-amber-400/80"
                      />
                      <span className="text-xs font-bold text-amber-300">{m.sender?.nickname}</span>
                      <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[9px] font-semibold text-slate-400 border border-slate-800">
                        {m.sender?.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed pl-9">{m.content}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Send Input */}
          <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Chat in the Lounge..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-2.5 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Active Artists Sidebar (1 col) */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 h-[580px] flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
            <Users className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Lounge Presence</h3>
          </div>

          <p className="text-[11px] text-slate-400 mb-4">
            Artists currently hanging out in this room:
          </p>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {roomUsers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No other users online right now.</p>
            ) : (
              roomUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5 rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                  <div className="relative">
                    <img src={u.avatarUrl} alt={u.nickname} className="h-8 w-8 rounded-full object-cover border border-amber-400/60" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-slate-950"></span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{u.nickname}</p>
                    <p className="text-[10px] text-amber-400">{u.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
