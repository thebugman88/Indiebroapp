import React from 'react';
import { GitMerge } from 'lucide-react';
import { GENRE_STRUCTURES } from '../data/structures';

interface StructureSelectorProps {
  selectedGenre: string;
  customGenre: string;
  selectedStructure: string;
  onSelectStructure: (structure: string) => void;
}

export const StructureSelector: React.FC<StructureSelectorProps> = ({
  selectedGenre,
  customGenre,
  selectedStructure,
  onSelectStructure
}) => {
  const genreKey = customGenre && customGenre.trim() ? 'Other' : (GENRE_STRUCTURES[selectedGenre] ? selectedGenre : 'Hip-Hop');
  const structures = GENRE_STRUCTURES[genreKey] || GENRE_STRUCTURES['Hip-Hop'];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <GitMerge className="w-4 h-4" />
          4. Song Structure Layout
        </label>
        <span className="text-[10px] font-mono text-zinc-400">
          Tailored for {customGenre ? `"${customGenre}"` : selectedGenre}
        </span>
      </div>

      <select
        value={selectedStructure}
        onChange={(e) => onSelectStructure(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-amber-400 transition"
      >
        {structures.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <p className="text-[10px] text-zinc-500">
        Structure layouts automatically adapt based on your selected genre.
      </p>
    </div>
  );
};
