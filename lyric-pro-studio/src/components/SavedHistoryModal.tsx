import React from 'react';
import { History, Trash2, X, FileText, Calendar, ArrowUpRight } from 'lucide-react';
import { SavedLyricEntry } from '../types';

interface SavedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedEntries: SavedLyricEntry[];
  onSelectEntry: (entry: SavedLyricEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
}

export const SavedHistoryModal: React.FC<SavedHistoryModalProps> = ({
  isOpen,
  onClose,
  savedEntries,
  onSelectEntry,
  onDeleteEntry,
  onClearAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 max-w-2xl w-full rounded-2xl p-6 shadow-2xl flex flex-col justify-between max-h-[85vh]">
        
        {/* HEADER */}
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Temporary Lyric History ({savedEntries.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Encrypted history: up to 5 pairs (10 songs), expiring 24 hours after generation. Download to keep.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* LIST OF SAVED ENTRIES */}
          {savedEntries.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-50" />
              <p className="text-xs">No saved lyric sets yet.</p>
              <p className="text-[11px] text-zinc-600">Newly generated songs are kept here temporarily.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {savedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between group"
                >
                  <div 
                    onClick={() => {
                      onSelectEntry(entry);
                      onClose();
                    }}
                    className="cursor-pointer flex-1 pr-4"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">
                        {entry.genre} • {entry.vibe}
                      </span>
                      {entry.explicit && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-1.5 py-0.2 rounded border border-rose-500/30">
                          EXPLICIT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{entry.setA.title}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        onSelectEntry(entry);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-zinc-950 text-xs font-bold flex items-center gap-1 transition"
                    >
                      <span>Load</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {savedEntries.length > 0 && (
          <div className="border-t border-zinc-800 pt-4 mt-4 flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Entire Vault</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
