import React, { useState } from 'react';
import { UserProfile, GenreType } from '../types';
import { User, Mic, Music, Sparkles, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  currentProfile: UserProfile | null;
}

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

const ROLES = [
  'Rapper',
  'Producer',
  'Singer/Songwriter',
  'Audio Engineer',
  'Designer',
  'Marketer',
] as const;

const GENRES: GenreType[] = [
  'Hip-Hop',
  'R&B',
  'Trap',
  'Lo-Fi',
  'Pop/Indie',
  'Rock/Alternative',
  'EDM',
  'Drill',
  'Afrobeat',
];

export const NicknameModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  currentProfile,
}) => {
  const [nickname, setNickname] = useState(currentProfile?.nickname || '');
  const [role, setRole] = useState<UserProfile['role']>(currentProfile?.role || 'Rapper');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatarUrl || AVATARS[0]);
  const [favoriteGenre, setFavoriteGenre] = useState<GenreType>(currentProfile?.favoriteGenre || 'Hip-Hop');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('Please enter a nickname or artist handle');
      return;
    }

    const newProfile: UserProfile = {
      id: currentProfile?.id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      nickname: trimmed,
      role,
      avatarUrl,
      favoriteGenre,
      battlesWon: currentProfile?.battlesWon || 0,
      battlesTotal: currentProfile?.battlesTotal || 0,
      reputation: currentProfile?.reputation || 100,
    };

    onSave(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl shadow-amber-500/10">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Artist Identity</h2>
            <p className="text-xs text-amber-400/80 font-medium">Hang Out by indiebrotherhood</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Artist Handle / Nickname
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/70" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder="e.g. ApexVerse, SlickBeats, MC Spitfire"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Primary Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition ${
                    role === r
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Select Studio Avatar
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`relative flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border-2 transition ${
                    avatarUrl === url ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="h-full w-full object-cover" />
                  {avatarUrl === url && (
                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-amber-300" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Favorite Genre
            </label>
            <select
              value={favoriteGenre}
              onChange={(e) => setFavoriteGenre(e.target.value as GenreType)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Enter Hang Out Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
