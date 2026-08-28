import React from 'react';
import { FileText, Sparkles, HelpCircle, Trash2 } from 'lucide-react';

interface LyricSectionProps {
  lyrics: string;
  onChange: (value: string) => void;
  onOpenHelpModal: () => void;
}

export const LyricSection: React.FC<LyricSectionProps> = ({
  lyrics,
  onChange,
  onOpenHelpModal,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">
            Song Lyrics <span className="text-xs font-normal text-slate-400">(Optional but Recommended)</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {lyrics && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
          <button
            type="button"
            onClick={onOpenHelpModal}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Why add lyrics?
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={5}
          value={lyrics}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Paste your song lyrics here...
e.g.
[Verse 1]
Late nights on the highway again
Lost in the rhythm of a summer romance

[Chorus]
Oh, we got midnight on the highway...`}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-purple-500 transition-colors leading-relaxed"
        />

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-purple-300/80">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Unlocks rhyme scheme, narrative depth & phonetic bounce scoring.
          </span>
          <span className="font-mono text-slate-500">
            {lyrics.trim() ? `${lyrics.trim().split(/\s+/).length} words` : '0 words'}
          </span>
        </div>
      </div>
    </div>
  );
};
