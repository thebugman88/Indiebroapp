import React, { useState, useEffect, useRef } from 'react';
import { GenreType, ChatMessage, UserProfile } from '../../types';
import { Users, Music, Send, FileText, Play, Volume2, Sparkles, Mic } from 'lucide-react';

interface Props {
  currentUser: UserProfile | null;
  messages: ChatMessage[];
  sharedPadContent: string;
  roomUsers: UserProfile[];
  onSendMessage: (roomId: string, message: Partial<ChatMessage>) => void;
  onUpdateSharedPad: (roomId: string, content: string) => void;
  onSelectGenreRoom: (genre: GenreType) => void;
  currentGenre: GenreType;
  onRequireNickname: () => void;
}

const GENRES: { id: GenreType; label: string; icon: string; desc: string }[] = [
  { id: 'Hip-Hop', label: 'Hip-Hop', icon: '🎤', desc: 'Boom bap, story-telling & classic cyphers' },
  { id: 'R&B', label: 'R&B / Soul', icon: '🎹', desc: 'Silky melodies, vocal chops & hooks' },
  { id: 'Trap', label: 'Trap', icon: '🔊', desc: '808s, fast hi-hats & melodic flows' },
  { id: 'Lo-Fi', label: 'Lo-Fi Chill', icon: '☕', desc: 'Relaxed beats, sample flippers & study jams' },
  { id: 'Pop/Indie', label: 'Pop & Indie', icon: '🎸', desc: 'Catchy song structures & acoustic vibes' },
  { id: 'Rock/Alternative', label: 'Rock / Alt', icon: '⚡', desc: 'Guitars, heavy energy & live drums' },
  { id: 'EDM', label: 'EDM / Dance', icon: '🎛️', desc: 'Synth leads, drops & electronic grooves' },
  { id: 'Drill', label: 'Drill', icon: '🗡️', desc: 'Sliding 808s & dark atmospheric soundscapes' },
  { id: 'Afrobeat', label: 'Afrobeat', icon: '🥁', desc: 'Rhythmic percussion, warmth & island bounce' },
];

export const CollaborationRoom: React.FC<Props> = ({
  currentUser,
  messages,
  sharedPadContent,
  roomUsers,
  onSendMessage,
  onUpdateSharedPad,
  onSelectGenreRoom,
  currentGenre,
  onRequireNickname,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [padText, setPadText] = useState(sharedPadContent);
  const [activeTab, setActiveTab] = useState<'chat' | 'pad'>('chat');
  const [beatTitle, setBeatTitle] = useState('');
  const [beatBpm, setBeatBpm] = useState(140);
  const [beatUrl, setBeatUrl] = useState('');
  const [showBeatModal, setShowBeatModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPadText(sharedPadContent);
  }, [sharedPadContent]);

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

    onSendMessage(`collaboration-${currentGenre}`, {
      sender: currentUser,
      content: inputMessage.trim(),
      type: 'text',
    });
    setInputMessage('');
  };

  const handlePadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPadText(newText);
    onUpdateSharedPad(`collaboration-${currentGenre}`, newText);
  };

  const handleShareBeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireNickname();
      return;
    }
    if (!beatTitle.trim()) return;

    onSendMessage(`collaboration-${currentGenre}`, {
      sender: currentUser,
      content: `🎵 Shared Instrumental Beat: "${beatTitle}" (${beatBpm} BPM)`,
      type: 'beat',
      beatData: {
        title: beatTitle,
        bpm: beatBpm,
        genre: currentGenre,
        audioUrl: beatUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
    });

    setBeatTitle('');
    setBeatUrl('');
    setShowBeatModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Genre Selector Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-400" />
              Genre-Based Collaboration Hub
            </h2>
            <p className="text-xs text-slate-400">
              Select a genre to join the dedicated artist chat, share instrumentals, and write lyrics in real-time.
            </p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
            Current Room: {currentGenre}
          </span>
        </div>

        {/* Genre Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelectGenreRoom(g.id)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
                currentGenre === g.id
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{g.icon}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Chat + Shared Scratchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Feed Column (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col h-[580px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎵</span>
              <div>
                <h3 className="text-base font-bold text-white">{currentGenre} Main Chat</h3>
                <p className="text-[11px] text-slate-400">{roomUsers.length} Artists active in this genre</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBeatModal(!showBeatModal)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
              >
                <Music className="h-4 w-4" />
                Share Beat
              </button>
            </div>
          </div>

          {/* Share Beat Modal / Inline Form */}
          {showBeatModal && (
            <form onSubmit={handleShareBeat} className="mb-4 rounded-2xl bg-slate-950 p-4 border border-amber-500/30 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Share Instrumental Track</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Beat Title (e.g. Midnight Waves)"
                  value={beatTitle}
                  onChange={(e) => setBeatTitle(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="BPM (e.g. 140)"
                  value={beatBpm}
                  onChange={(e) => setBeatBpm(Number(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Audio URL (optional, defaults to audio stream demo)"
                value={beatUrl}
                onChange={(e) => setBeatUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBeatModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Publish Beat to Chat
                </button>
              </div>
            </form>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs italic">
                Welcome to the {currentGenre} room! Start the conversation or share your latest track above.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={m.sender?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={m.sender?.nickname}
                        className="h-6 w-6 rounded-full object-cover border border-amber-400/60"
                      />
                      <span className="text-xs font-bold text-amber-300">{m.sender?.nickname}</span>
                      <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 border border-slate-800">
                        {m.sender?.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {m.type === 'beat' && m.beatData ? (
                    <div className="mt-2 rounded-xl bg-amber-500/10 p-3 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                          <Music className="h-4 w-4" />
                          {m.beatData.title}
                        </span>
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                          {m.beatData.bpm} BPM
                        </span>
                      </div>
                      <audio src={m.beatData.audioUrl} controls className="h-8 w-full" />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed pl-8">{m.content}</p>
                  )}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Send Input */}
          <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Message ${currentGenre} artists...`}
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

        {/* Shared Lyric Scratchpad Column (1 col) */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col h-[580px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Real-Time Lyric Scratchpad</h3>
            </div>
            <span className="text-[10px] text-amber-400 font-medium animate-pulse">Live Sync</span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3">
            Collaborative lyric document for {currentGenre}. Any lyrics typed here sync instantly with all artists in this room!
          </p>

          <textarea
            value={padText}
            onChange={handlePadChange}
            placeholder="Type lyrics, hook ideas, chord progressions, or arrangement notes here..."
            className="flex-1 w-full rounded-2xl border border-slate-700/80 bg-slate-950 p-4 text-xs font-mono text-amber-200/90 leading-relaxed focus:border-amber-500 focus:outline-none resize-none scrollbar-thin"
          />

          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
            <span>Hang Out Collaborative Notepad</span>
            <span>{padText.length} Characters</span>
          </div>
        </div>
      </div>
    </div>
  );
};
