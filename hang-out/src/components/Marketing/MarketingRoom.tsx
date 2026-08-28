import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile, GenreType } from '../../types';
import { backendApiUrl } from '../../services/backend';
import { TrendingUp, Sparkles, Send, Rocket, CheckCircle, Video, ListOrdered, FileText, RefreshCw } from 'lucide-react';

interface Props {
  currentUser: UserProfile | null;
  messages: ChatMessage[];
  onSendMessage: (roomId: string, message: Partial<ChatMessage>) => void;
  onRequireNickname: () => void;
}

export const MarketingRoom: React.FC<Props> = ({
  currentUser,
  messages,
  onSendMessage,
  onRequireNickname,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackGenre, setTrackGenre] = useState<GenreType>('Hip-Hop');
  const [trackVibe, setTrackVibe] = useState('');
  const [strategyResult, setStrategyResult] = useState<any | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

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

    onSendMessage('marketing', {
      sender: currentUser,
      content: inputMessage.trim(),
      type: 'text',
    });
    setInputMessage('');
  };

  const handleGenerateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireNickname();
      return;
    }
    if (!trackTitle.trim()) return;

    setIsGeneratingPlan(true);
    try {
      const res = await fetch(backendApiUrl('/api/gemini/marketing-advisor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle,
          genre: trackGenre,
          vibe: trackVibe || 'Energetic, soulful, and melodic',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStrategyResult(data.strategy);
      }
    } catch (err) {
      console.error('Failed to generate marketing plan:', err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Marketing Hero Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 mb-2">
              <TrendingUp className="h-4 w-4" />
              INDIE MARKETING & ROLLOUT HUB
            </div>
            <h2 className="text-2xl font-black text-white">Music Marketing & Promotion Ideas</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Discuss promotion strategies, TikTok video ideas, Spotify playlist pitches, and press releases with fellow artists — or run our Gemini AI Strategy Generator below!
            </p>
          </div>
        </div>
      </div>

      {/* AI Strategy Generator + Community Chat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gemini AI Strategy Form & Results (1 col) */}
        <div className="rounded-3xl border border-amber-500/30 bg-slate-900/90 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">AI Release Strategy Generator</h3>
          </div>

          <form onSubmit={handleGenerateStrategy} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Single Track Title
              </label>
              <input
                type="text"
                placeholder="e.g. Unstoppable, No Apologies"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Genre
              </label>
              <select
                value={trackGenre}
                onChange={(e) => setTrackGenre(e.target.value as GenreType)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Hip-Hop">Hip-Hop</option>
                <option value="Trap">Trap</option>
                <option value="R&B">R&B</option>
                <option value="Drill">Drill</option>
                <option value="Lo-Fi">Lo-Fi</option>
                <option value="Pop/Indie">Pop / Indie</option>
                <option value="Rock/Alternative">Rock / Alt</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Vibe / Story (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Late night driving vibe with heavy 808s and catchy melodic hook."
                value={trackVibe}
                onChange={(e) => setTrackVibe(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGeneratingPlan || !trackTitle.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPlan ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Building Custom Rollout...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Generate 4-Week Rollout Plan
                </>
              )}
            </button>
          </form>

          {strategyResult && (
            <div className="space-y-4 rounded-2xl bg-slate-950 p-4 border border-amber-500/30 text-xs overflow-y-auto max-h-[380px] scrollbar-thin">
              <div>
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  Spotify Playlist Pitch Angles
                </h4>
                <ul className="list-disc list-inside text-slate-300 space-y-1 pl-1">
                  {strategyResult.playlistPitching?.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <Video className="h-4 w-4" />
                  TikTok & Reels Video Concepts
                </h4>
                <ul className="list-disc list-inside text-slate-300 space-y-1 pl-1">
                  {strategyResult.tikTokHooks?.map((h: string, i: number) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <ListOrdered className="h-4 w-4" />
                  4-Week Rollout Schedule
                </h4>
                <div className="space-y-2">
                  {strategyResult.rolloutTimeline?.map((item: any, i: number) => (
                    <div key={i} className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                      <span className="font-bold text-amber-400 block">{item.week}</span>
                      <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                        {item.tasks?.map((t: string, j: number) => (
                          <li key={j}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <FileText className="h-4 w-4" />
                  EPK Press Tip
                </h4>
                <p className="text-slate-300 italic">{strategyResult.epkTips}</p>
              </div>
            </div>
          )}
        </div>

        {/* Marketing Chat Room (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col h-[620px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h3 className="text-base font-bold text-white">Marketing Ideas Discussion Feed</h3>
            <span className="text-xs text-slate-400">Share tips & growth tactics</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="text-center py-24 text-slate-500 text-xs italic">
                No marketing discussions yet. Ask a question or share your single release tips!
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
              placeholder="Discuss marketing, TikTok algorithms, or pitch ideas..."
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
    </div>
  );
};
