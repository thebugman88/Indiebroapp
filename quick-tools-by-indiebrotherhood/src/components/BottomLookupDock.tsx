import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Copy,
  Check,
  HelpCircle,
  Hash,
  CornerDownLeft,
  Volume2
} from 'lucide-react';
import { fetchExactRhymes, fetchNearRhymes, fetchDefinitions, countSyllables } from '../utils/rhymeEngine';
import { RhymeResult, DefinitionResult } from '../types';

interface BottomLookupDockProps {
  onInsertWord?: (word: string) => void;
}

type LookupMode = 'exact' | 'near' | 'def';

export const BottomLookupDock: React.FC<BottomLookupDockProps> = ({ onInsertWord }) => {
  const [word, setWord] = useState('');
  const [activeMode, setActiveMode] = useState<LookupMode>('exact');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rhymeResults, setRhymeResults] = useState<RhymeResult[]>([]);
  const [defResults, setDefResults] = useState<DefinitionResult[]>([]);
  const [syllableFilter, setSyllableFilter] = useState<number | 'all'>('all');
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Global key listener for '/' to focus dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey || (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA'))) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLookup = async (mode: LookupMode, overrideWord?: string) => {
    const targetWord = (overrideWord !== undefined ? overrideWord : word).trim();
    if (!targetWord) {
      inputRef.current?.focus();
      return;
    }

    setActiveMode(mode);
    setIsDrawerOpen(true);
    setIsLoading(true);
    setErrorMsg(null);
    const requestId = ++requestIdRef.current;

    try {
      if (mode === 'exact') {
        const results = await fetchExactRhymes(targetWord);
        if (requestId === requestIdRef.current) setRhymeResults(results);
        if (requestId === requestIdRef.current && results.length === 0) {
          setErrorMsg(`no exact rhymes found for "${targetWord}"`);
        }
      } else if (mode === 'near') {
        const results = await fetchNearRhymes(targetWord);
        if (requestId === requestIdRef.current) setRhymeResults(results);
        if (requestId === requestIdRef.current && results.length === 0) {
          setErrorMsg(`no near/slant rhymes found for "${targetWord}"`);
        }
      } else if (mode === 'def') {
        const results = await fetchDefinitions(targetWord);
        if (requestId === requestIdRef.current) setDefResults(results);
        if (requestId === requestIdRef.current && results.length === 0) {
          setErrorMsg(`no definition available for "${targetWord}"`);
        }
      }
    } catch (err) {
      if (requestId === requestIdRef.current) setErrorMsg('lookup failed. check connection or try another word.');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWord(text);
    setTimeout(() => setCopiedWord(null), 1500);
  };

  const currentSyllables = word.trim() ? countSyllables(word.trim()) : 0;

  // Filter rhyme results by syllables
  const filteredRhymes = syllableFilter === 'all'
    ? rhymeResults
    : rhymeResults.filter((r) => r.numSyllables === syllableFilter);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 pointer-events-auto">
        {/* Expandable Results Drawer */}
        {isDrawerOpen && (
          <div
            id="bottom-dock-drawer"
            className="mb-2 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#080808] text-xs font-mono">
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  {activeMode === 'exact' ? 'exact rhymes' : activeMode === 'near' ? 'near rhymes' : 'definitions'}
                </span>
                <span className="text-white/30">for</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-white font-bold font-mono border border-white/5">
                  "{word.trim()}"
                </span>
                {currentSyllables > 0 && (
                  <span className="text-white/30 text-[11px]">
                    ({currentSyllables} {currentSyllables === 1 ? 'syl' : 'syls'})
                  </span>
                )}
              </div>

              {/* Syllable Filter Tabs if rhyming */}
              {activeMode !== 'def' && rhymeResults.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/30 mr-1 hidden sm:inline uppercase font-bold">syl:</span>
                  {(['all', 1, 2, 3, 4] as const).map((syl) => (
                    <button
                      key={syl}
                      id={`dock-syl-filter-${syl}`}
                      onClick={() => setSyllableFilter(syl)}
                      className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${syllableFilter === syl
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                          : 'bg-white/5 text-white/50 hover:text-white'
                        }`}
                    >
                      {syl === 'all' ? 'all' : `${syl}s`}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 ml-2">
                <button
                  id="dock-close-drawer-btn"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white cursor-pointer transition-colors"
                  title="Close Drawer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Drawer Body with scrollbar */}
            <div className="max-h-48 sm:max-h-56 overflow-y-auto p-3 text-xs">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-white/40 gap-2 font-mono">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>searching phonetics...</span>
                </div>
              ) : errorMsg ? (
                <div className="text-center py-6 text-white/40 font-mono space-y-1">
                  <p>{errorMsg}</p>
                  <p className="text-[11px] text-white/20">try near rhymes or standard spelling</p>
                </div>
              ) : activeMode === 'def' ? (
                /* Definition cards */
                <div className="space-y-2">
                  {defResults.map((d, i) => (
                    <div key={i} className="bg-[#050505] border border-white/5 p-3 rounded-xl text-white/80 font-sans">
                      {d.partOfSpeech && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-white/5 text-emerald-400 font-mono text-[10px] uppercase mr-2 font-bold border border-white/5">
                          {d.partOfSpeech}
                        </span>
                      )}
                      <span>{d.definition}</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Rhyme Chips */
                <div className="flex flex-wrap gap-1.5">
                  {filteredRhymes.map((item, idx) => {
                    const isCopied = copiedWord === item.word;
                    return (
                      <div
                        key={idx}
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#050505] hover:bg-white/5 border border-white/5 hover:border-white/10 text-white/90 transition-all font-mono"
                      >
                        <span
                          onClick={() => {
                            if (onInsertWord) {
                              onInsertWord(item.word);
                            } else {
                              handleCopy(item.word);
                            }
                          }}
                          className="cursor-pointer hover:text-emerald-400 font-medium"
                          title={onInsertWord ? 'Click to insert into active lyrics' : 'Click to copy'}
                        >
                          {item.word}
                        </span>
                        <span className="text-[10px] text-white/30 font-sans">
                          {item.numSyllables}s
                        </span>

                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                          {onInsertWord && (
                            <button
                              onClick={() => onInsertWord(item.word)}
                              className="p-0.5 text-white/40 hover:text-emerald-400 cursor-pointer"
                              title="Insert word into lyrics"
                            >
                              <CornerDownLeft className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(item.word)}
                            className="p-0.5 text-white/40 hover:text-white cursor-pointer"
                            title="Copy to clipboard"
                          >
                            {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* The Sticky Dock Bar */}
        <div
          id="global-lookup-dock"
          className="bg-[#111]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl px-3.5 py-2.5 mb-3 flex items-center justify-between gap-2 sm:gap-3 transition-all"
        >
          {/* Left: Input with Search Icon & Syllable Indicator */}
          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-4 h-4 text-white/30 absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              id="dock-target-word-input"
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLookup(activeMode);
                }
              }}
              placeholder="quick word lookup... (cmd+/)"
              className="w-full bg-[#050505] border border-white/5 rounded-xl pl-9 pr-14 sm:pr-16 py-1.5 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {word.trim() && (
              <div className="absolute right-2.5 flex items-center gap-1.5 text-[11px] font-mono text-white/40 select-none">
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-emerald-400 font-bold border border-white/5">
                  {currentSyllables} {currentSyllables === 1 ? 'syl' : 'syls'}
                </span>
                <button
                  onClick={() => setWord('')}
                  className="text-white/40 hover:text-white cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Center/Right: Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              id="dock-btn-exact-rhyme"
              onClick={() => handleLookup('exact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono lowercase font-medium transition-all cursor-pointer flex items-center gap-1.5 ${isDrawerOpen && activeMode === 'exact'
                  ? 'bg-emerald-500 text-black shadow-sm font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 hover:border-white/10'
                }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">exact</span>
              <span>rhyme</span>
            </button>

            <button
              id="dock-btn-near-rhyme"
              onClick={() => handleLookup('near')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono lowercase font-medium transition-all cursor-pointer flex items-center gap-1.5 ${isDrawerOpen && activeMode === 'near'
                  ? 'bg-cyan-500 text-black shadow-sm font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 hover:border-white/10'
                }`}
            >
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">near</span>
              <span>slant</span>
            </button>

            <button
              id="dock-btn-definition"
              onClick={() => handleLookup('def')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono lowercase font-medium transition-all cursor-pointer flex items-center gap-1.5 ${isDrawerOpen && activeMode === 'def'
                  ? 'bg-violet-500 text-black shadow-sm font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 hover:border-white/10'
                }`}
            >
              <HelpCircle className="w-3 h-3 text-violet-400" />
              <span>def</span>
            </button>

            {/* Toggle Drawer button */}
            <button
              id="dock-toggle-drawer-btn"
              onClick={() => {
                if (!isDrawerOpen) {
                  handleLookup(activeMode);
                } else {
                  setIsDrawerOpen(false);
                }
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 cursor-pointer transition-colors"
              title={isDrawerOpen ? 'Collapse drawer' : 'Expand drawer'}
            >
              {isDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
