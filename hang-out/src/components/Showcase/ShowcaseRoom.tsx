import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile } from '../../types';
import { Music, Image, Send, ThumbsUp, Sparkles, Disc, Palette } from 'lucide-react';

interface Props {
  currentUser: UserProfile | null;
  messages: ChatMessage[];
  onSendMessage: (roomId: string, message: Partial<ChatMessage>) => void;
  onRequireNickname: () => void;
}

export const ShowcaseRoom: React.FC<Props> = ({
  currentUser,
  messages,
  onSendMessage,
  onRequireNickname,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [sampleTrackUrl, setSampleTrackUrl] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

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

    onSendMessage('beat-showcase', {
      sender: currentUser,
      content: inputMessage.trim(),
      type: 'text',
    });
    setInputMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Showcase Hero Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 mb-2">
              <Music className="h-4 w-4" />
              BEAT & COVER ART CRITIQUE SHOWCASE
            </div>
            <h2 className="text-2xl font-black text-white">Showcase Beats & Artwork</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Producers post instrumental beats, graphic designers share cover artwork drafts, and artists give constructive critique and connect for placements.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col h-[580px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Disc className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Showcase Feed</h3>
          </div>
          <span className="text-xs text-amber-400 font-semibold">Community Feedback Active</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs italic">
              Welcome to the Beat & Artwork Showcase! Post your beat demo or artwork link below.
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

        <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Post beat link, cover art draft, or give feedback..."
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
    </div>
  );
};
