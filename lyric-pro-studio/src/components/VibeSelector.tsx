import React from 'react';
import { Flame } from 'lucide-react';
import { VibeOption } from '../types';

interface VibeSelectorProps {
  selectedVibe: VibeOption;
  customVibe: string;
  onSelectVibe: (vibe: VibeOption) => void;
  onCustomVibeChange: (val: string) => void;
}

const VIBES: VibeOption[] = [
  'Energetic',
  'Melancholic',
  'Aggressive',
  'Smooth',
  'Trippy',
  'Motivational',
  'Dark',
  'Romantic',
  'Euphoric',
  'Chill'
];

export const VibeSelector: React.FC<VibeSelectorProps> = ({
  selectedVibe,
  customVibe,
  onSelectVibe,
  onCustomVibeChange
}) => {
  const isOtherActive = selectedVibe === 'Other';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Flame className="w-4 h-4" />
          2. Vibe / Mood Selector
        </label>
        {isOtherActive && (
          <span className="text-[10px] font-mono font-medium text-amber-300">
            Custom Vibe Active
          </span>
        )}
      </div>

      {/* CHIPS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {VIBES.map((v) => {
          const isActive = selectedVibe === v && !customVibe;
          return (
            <button
              key={v}
              type="button"
              onClick={() => {
                onSelectVibe(v);
                onCustomVibeChange('');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition duration-150 ${
                isActive
                  ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-100 hover:border-amber-400/60 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>

      {/* OTHER CUSTOM VIBE SECTION */}
      <div className="pt-1">
        <div className="relative">
          <input
            type="text"
            value={customVibe}
            maxLength={10}
            onChange={(e) => {
              const val = e.target.value.slice(0, 10);
              onCustomVibeChange(val);
              if (val.length > 0) {
                onSelectVibe('Other');
              }
            }}
            placeholder="Other Vibe (Max 10 Chars)"
            className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition ${
              customVibe.length > 0 || isOtherActive
                ? 'border-amber-400 ring-1 ring-amber-400/50'
                : 'border-zinc-800 focus:border-zinc-600'
            }`}
          />
          <span className={`absolute right-3 top-2.5 text-[10px] font-mono ${
            customVibe.length >= 10 ? 'text-rose-400 font-bold' : 'text-zinc-500'
          }`}>
            {customVibe.length}/10
          </span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">
          Select a preset mood above or type a custom vibe (strictly max 10 characters).
        </p>
      </div>
    </div>
  );
};
