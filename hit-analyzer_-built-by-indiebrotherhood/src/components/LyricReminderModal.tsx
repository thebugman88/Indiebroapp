import React, { useState } from 'react';
import { FileText, Sparkles, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface LyricReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLyrics: () => void;
  onProceedWithoutLyrics: () => void;
  onDontShowAgainToggle: (dontShow: boolean) => void;
}

export const LyricReminderModal: React.FC<LyricReminderModalProps> = ({
  isOpen,
  onClose,
  onAddLyrics,
  onProceedWithoutLyrics,
  onDontShowAgainToggle,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (dontShowAgain) {
      onDontShowAgainToggle(true);
    }
    onProceedWithoutLyrics();
  };

  const handleAddLyricsClick = () => {
    if (dontShowAgain) {
      onDontShowAgainToggle(true);
    }
    onAddLyrics();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Best Results Reminder
            </h3>
            <p className="text-xs text-purple-300 font-medium">
              Maximize your 2026 Hit Potential Score
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          For the most accurate and actionable breakdown, we strongly recommend entering your song lyrics! Adding lyrics unlocks:
        </p>

        <ul className="space-y-2 mb-5 text-xs text-slate-300 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <li className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span><strong className="text-white">Phonetic Rhythm & Downbeat Alignment</strong> evaluation</span>
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span><strong className="text-white">Rhyme Scheme Precision & Earworm Index</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span><strong className="text-white">Chorus Storytelling & Emotional Impact</strong> scoring</span>
          </li>
        </ul>

        {/* Don't show again checkbox */}
        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="dontShowAgain"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
          />
          <label htmlFor="dontShowAgain" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
            Don't show me this reminder anymore
          </label>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            Analyze Audio Only
          </button>

          <button
            type="button"
            onClick={handleAddLyricsClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
          >
            Add Lyrics First <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
