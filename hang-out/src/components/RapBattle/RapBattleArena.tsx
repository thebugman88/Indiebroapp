import { authenticatedFetch } from '../../../../src/services/authService';
import React, { useState, useEffect, useRef } from 'react';
import { BattleState, UserProfile } from '../../types';
import { JudgePanel } from './JudgePanel';
import { Mic, Send, Volume2, Flame, Award, Clock, Sparkles, StopCircle, ArrowLeft } from 'lucide-react';
import { backendApiUrl } from '../../services/backend';

interface Props {
  battle: BattleState;
  currentUser: UserProfile | null;
  onSubmitVerse: (verseText: string, audioUrl?: string) => void;
  onVote: (voteForPlayerId: string) => void;
  onLeave: () => void;
  onRequireNickname: () => void;
}

export const RapBattleArena: React.FC<Props> = ({
  battle,
  currentUser,
  onSubmitVerse,
  onVote,
  onLeave,
  onRequireNickname,
}) => {
  const [verseInput, setVerseInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isGeneratingRhymes, setIsGeneratingRhymes] = useState(false);
  const [rhymeSuggestions, setRhymeSuggestions] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isMyTurn = currentUser ? battle.turnPlayerId === currentUser.id : false;

  // Handle voice recording
  const startRecording = async () => {
    if (!currentUser) {
      onRequireNickname();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendVerse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireNickname();
      return;
    }

    if (!verseInput.trim() && !recordedAudioUrl) return;

    onSubmitVerse(verseInput.trim() || '[Audio Verse Dropped]', recordedAudioUrl || undefined);
    setVerseInput('');
    setRecordedAudioUrl(null);
  };

  // Rhyme Assistant
  const fetchRhymeInspiration = async () => {
    setIsGeneratingRhymes(true);
    try {
      const lastWords = verseInput.split(' ').slice(-1)[0] || 'fire';
      const prompt = `Give me 4 clever battle rap end-rhymes for the word "${lastWords}". Return plain comma-separated list.`;
      const res = await authenticatedFetch(backendApiUrl('/api/gemini/ai-bot-rap'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName: 'Rhyme Engine',
          tier: battle.tier,
          opponentVerse: verseInput,
        }),
      });
      const data = await res.json();
      if (data.verse) {
        setRhymeSuggestions([data.verse]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingRhymes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Back Navigation */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 border border-slate-800">
        <button
          onClick={onLeave}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Exit Battle Ring
        </button>
        <div className="text-center">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 uppercase tracking-widest">
            {battle.tier} Battle Ring • Round {battle.currentRound} of 3
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>45s Timer</span>
        </div>
      </div>

      {/* Contestants Matchup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1 Card */}
        <div
          className={`relative rounded-2xl border p-5 transition ${battle.turnPlayerId === battle.player1.id
              ? 'border-amber-500 bg-slate-900 shadow-xl shadow-amber-500/10'
              : 'border-slate-800 bg-slate-950/80 opacity-80'
            }`}
        >
          {battle.turnPlayerId === battle.player1.id && (
            <div className="absolute top-3 right-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-950 animate-pulse">
              On The Mic
            </div>
          )}
          <div className="flex items-center gap-4">
            <img
              src={battle.player1.avatarUrl}
              alt={battle.player1.nickname}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-amber-400/80"
            />
            <div>
              <h3 className="text-lg font-black text-white">{battle.player1.nickname}</h3>
              <p className="text-xs text-amber-400 font-medium">{battle.player1.role} • {battle.player1.favoriteGenre}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Record: {battle.player1.battlesWon}W / {battle.player1.battlesTotal}L
              </p>
            </div>
          </div>
        </div>

        {/* Player 2 Card */}
        <div
          className={`relative rounded-2xl border p-5 transition ${battle.turnPlayerId === battle.player2.id
              ? 'border-amber-500 bg-slate-900 shadow-xl shadow-amber-500/10'
              : 'border-slate-800 bg-slate-950/80 opacity-80'
            }`}
        >
          {battle.turnPlayerId === battle.player2.id && (
            <div className="absolute top-3 right-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-950 animate-pulse">
              On The Mic
            </div>
          )}
          <div className="flex items-center gap-4">
            <img
              src={battle.player2.avatarUrl}
              alt={battle.player2.nickname}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-amber-400/80"
            />
            <div>
              <h3 className="text-lg font-black text-white">{battle.player2.nickname}</h3>
              <p className="text-xs text-amber-400 font-medium">{battle.player2.role} • {battle.player2.favoriteGenre}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Record: {battle.player2.battlesWon}W / {battle.player2.battlesTotal}L
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Battle Verses Feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 min-h-[220px] max-h-[360px] overflow-y-auto space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 border-b border-slate-800 pb-2">
          Rap Battle Ring Feed
        </h4>

        {battle.verses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm italic">
            Round 1 is open! {battle.player1.nickname} has the mic. Drop your bars!
          </div>
        ) : (
          battle.verses.map((v) => (
            <div
              key={v.id}
              className={`rounded-xl p-4 border ${v.authorId === battle.player1.id
                  ? 'border-amber-500/30 bg-slate-950 text-slate-100 ml-0 mr-8'
                  : 'border-slate-700 bg-slate-950/90 text-slate-100 ml-8 mr-0'
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-300">
                  {v.authorName} <span className="text-slate-500 font-normal">• Round {v.round}</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-slate-200">
                {v.text}
              </p>
              {v.audioUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <audio src={v.audioUrl} controls className="h-8 w-full max-w-xs" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Verse Submission Form (Only active when in progress) */}
      {battle.status === 'in-progress' && (
        <form onSubmit={handleSendVerse} className="rounded-2xl border border-amber-500/30 bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">
              {isMyTurn ? '🔥 Your turn to drop bars!' : `Waiting for ${battle.turnPlayerId === battle.player1.id ? battle.player1.nickname : battle.player2.nickname}...`}
            </span>
            <button
              type="button"
              onClick={fetchRhymeInspiration}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isGeneratingRhymes ? 'Generating Rhymes...' : 'Rhyme Assistant'}
            </button>
          </div>

          {rhymeSuggestions.length > 0 && (
            <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/30 text-xs text-amber-300">
              <p className="font-bold mb-1">AI Rhyme Suggestion:</p>
              <p className="italic">{rhymeSuggestions[0]}</p>
            </div>
          )}

          <div className="relative">
            <textarea
              rows={3}
              value={verseInput}
              onChange={(e) => setVerseInput(e.target.value)}
              placeholder={
                isMyTurn
                  ? "Type your multi-syllabic bars and punchlines here..."
                  : "Spectating... (or prepare your response)"
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Audio Voice Memo Recoder */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-amber-500 transition"
                >
                  <Mic className="h-4 w-4 text-amber-400" />
                  Record Voice Verse
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500/20 border border-red-500/50 px-3 py-2 text-xs font-semibold text-red-300 animate-pulse"
                >
                  <StopCircle className="h-4 w-4 text-red-400" />
                  Stop Recording
                </button>
              )}

              {recordedAudioUrl && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Volume2 className="h-3.5 w-3.5" /> Audio Ready
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!isMyTurn && !recordedAudioUrl && !verseInput.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Drop Verse
            </button>
          </div>
        </form>
      )}

      {/* Judging Section inside Rap Battle Area */}
      <JudgePanel battle={battle} currentUser={currentUser} onVote={onVote} />
    </div>
  );
};
