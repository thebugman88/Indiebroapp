import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Flame,
  CheckCircle2,
  Music2,
  Compass,
  Zap,
  Check,
  Disc3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SonicTasteProfile, TrackGenre, UserJudgeProfile } from '../types';

interface SonicProfileViewProps {
  userProfile: UserJudgeProfile;
  onUpdateTasteProfile: (newTaste: SonicTasteProfile) => void;
  onNavigateToChamber: () => void;
}

const ALL_GENRES: TrackGenre[] = [
  'Hip-Hop / BoomBap',
  'Trap / Drill',
  'R&B / Neo-Soul',
  'Indie Rock / Alt',
  'Synthwave / Retro',
  'Afrobeats / Dancehall',
  'Pop / Electronic',
  'Lo-Fi / Chillhop',
  'Punk / Grunge',
  'Experimental / Ambient'
];

const ALL_MOODS = [
  'Introspective & Gritty',
  'Sensual & Hypnotic',
  'Electrifying & Cinematic',
  'Vibrant & Uplifting',
  'Heavy & Aggressive',
  'Melancholic & Nostalgic',
  'Chill & Relaxed'
];

export const SonicProfileView: React.FC<SonicProfileViewProps> = ({
  userProfile,
  onUpdateTasteProfile,
  onNavigateToChamber
}) => {
  const [taste, setTaste] = useState<SonicTasteProfile>(userProfile.tasteProfile);
  const [isSaved, setIsSaved] = useState(false);

  const toggleGenre = (genre: TrackGenre) => {
    setTaste((prev) => {
      const exists = prev.preferredGenres.includes(genre);
      const updated = exists
        ? prev.preferredGenres.filter((g) => g !== genre)
        : [...prev.preferredGenres, genre];
      return { ...prev, preferredGenres: updated };
    });
    setIsSaved(false);
  };

  const toggleMood = (mood: string) => {
    setTaste((prev) => {
      const exists = prev.preferredMoods.includes(mood);
      const updated = exists
        ? prev.preferredMoods.filter((m) => m !== mood)
        : [...prev.preferredMoods, mood];
      return { ...prev, preferredMoods: updated };
    });
    setIsSaved(false);
  };

  const toggleProductionFocus = (focus: 'lyrics' | 'vocals' | 'beat_production' | 'mix_master') => {
    setTaste((prev) => {
      const exists = prev.productionFocus.includes(focus);
      const updated = exists
        ? prev.productionFocus.filter((f) => f !== focus)
        : [...prev.productionFocus, focus];
      return { ...prev, productionFocus: updated };
    });
    setIsSaved(false);
  };

  const handleSave = () => {
    onUpdateTasteProfile(taste);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div id="sonic-profile-root" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-1">
          <Compass className="w-3.5 h-3.5" /> SONIC MATCHMAKING & DRIFT ENGINE
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Calibrate Your Chamber Drift Profile
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Configure your musical taste parameters. The IndieBrotherhood randomizer uses these preferences to drift the closest matching blind submissions to your queue, ensuring fair, authentic, and expert evaluation.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
        {/* 1. Preferred Genres */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Music2 className="w-4 h-4 text-amber-400" />
              1. Preferred Genres & Sonic Styles
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {taste.preferredGenres.length} Selected
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Select the genres you specialize in or love listening to. Songs from these genres will drift with higher priority.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
            {ALL_GENRES.map((g) => {
              const isSelected = taste.preferredGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`p-3 rounded-2xl border text-xs font-mono font-bold transition flex items-center justify-between gap-2 select-none ${
                    isSelected
                      ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-md'
                      : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
                  }`}
                >
                  <span className="truncate">{g}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Critical Production Focus */}
        <div className="space-y-3 border-t border-zinc-800/80 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              2. Critical Ear & Production Focus
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            What elements do you evaluate with highest scrutiny when listening?
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { id: 'lyrics', label: 'Lyrics & Story', desc: 'Rhymes & depth' },
              { id: 'vocals', label: 'Vocal Performance', desc: 'Tone & pitch' },
              { id: 'beat_production', label: 'Beat & Arrangement', desc: 'Groove & bass' },
              { id: 'mix_master', label: 'Mix & Mastering', desc: 'Clarity & balance' }
            ].map((item) => {
              const isSelected = taste.productionFocus.includes(item.id as any);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleProductionFocus(item.id as any)}
                  className={`p-4 rounded-2xl border text-left transition select-none ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-950/50 to-zinc-900 border-amber-500/70 text-white'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{item.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Mood & Energy Affinity */}
        <div className="space-y-3 border-t border-zinc-800/80 pt-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            3. Mood & Energy Affinity
          </h3>
          <div className="flex flex-wrap gap-2 pt-2">
            {ALL_MOODS.map((mood) => {
              const isSelected = taste.preferredMoods.includes(mood);
              return (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMood(mood)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-mono transition select-none ${
                    isSelected
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
                  }`}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Tempo / BPM Preference */}
        <div className="space-y-3 border-t border-zinc-800/80 pt-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            4. Tempo / Cadence Range
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { id: 'all', title: 'All Tempos', sub: 'Any BPM' },
              { id: 'slow', title: 'Downtempo', sub: '< 95 BPM' },
              { id: 'mid', title: 'Mid-Tempo', sub: '95 - 130 BPM' },
              { id: 'fast', title: 'Up-Tempo', sub: '> 130 BPM' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTaste({ ...taste, tempoPreference: t.id as any })}
                className={`p-3 rounded-2xl border text-center font-mono transition select-none ${
                  taste.tempoPreference === t.id
                    ? 'bg-amber-500 text-amber-950 font-bold border-amber-400'
                    : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
                }`}
              >
                <div className="text-xs font-bold">{t.title}</div>
                <div className="text-[10px] opacity-75 mt-0.5">{t.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800">
          <div className="text-xs text-emerald-400 font-mono">
            {isSaved && '✓ Drift Profile Updated Successfully!'}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleSave}
              type="button"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-bold text-xs font-mono shadow-xl transition cursor-pointer"
            >
              Save Drift Profile
            </button>

            <button
              onClick={() => {
                handleSave();
                onNavigateToChamber();
              }}
              type="button"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition"
            >
              <span>Apply & Enter Chamber</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
