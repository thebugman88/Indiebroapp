import React from 'react';
import { Music2 } from 'lucide-react';
import { GenreOption } from '../types';

interface GenreSelectorProps {
  selectedGenre: GenreOption;
  customGenre: string;
  onSelectGenre: (genre: GenreOption) => void;
  onCustomGenreChange: (val: string) => void;
}

const GENRES: GenreOption[] = [
  'Hip-Hop',
  'Pop',
  'R&B / Soul',
  'Rock / Alt',
  'Country',
  'EDM / Dance',
  'Metal',
  'Trap',
  'Indie',
  'Reggae'
];

export const GenreSelector: React.FC<GenreSelectorProps> = ({
  selectedGenre,
  customGenre,
  onSelectGenre,
  onCustomGenreChange
}) => {
  const isOtherActive = selectedGenre === 'Other';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Music2 className="w-4 h-4" />
          1. Genre Selection
        </label>
        {isOtherActive && (
          <span className="text-[10px] font-mono font-medium text-amber-300">
            Custom Genre Active
          </span>
        )}
      </div>

      {/* CHIPS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {GENRES.map((g) => {
          const isActive = selectedGenre === g && !customGenre;
          return (
            <button
              key={g}
              type="button"
              onClick={() => {
                onSelectGenre(g);
                onCustomGenreChange('');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition duration-150 ${
                isActive
                  ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-100 hover:border-amber-400/60 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* OTHER CUSTOM GENRE SECTION */}
      <div className="pt-1">
        <div className="relative">
          <input
            type="text"
            value={customGenre}
            maxLength={10}
            onChange={(e) => {
              const val = e.target.value.slice(0, 10);
              onCustomGenreChange(val);
              if (val.length > 0) {
                onSelectGenre('Other');
              }
            }}
            placeholder="Other (Max 10 Chars)"
            className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition ${
              customGenre.length > 0 || isOtherActive
                ? 'border-amber-400 ring-1 ring-amber-400/50'
                : 'border-zinc-800 focus:border-zinc-600'
            }`}
          />
          <span className={`absolute right-3 top-2.5 text-[10px] font-mono ${
            customGenre.length >= 10 ? 'text-rose-400 font-bold' : 'text-zinc-500'
          }`}>
            {customGenre.length}/10
          </span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">
          Select a preset genre above or type a custom term (strictly max 10 characters).
        </p>
      </div>
    </div>
  );
};
