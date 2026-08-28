import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Copy,
  Check,
  Download,
  Filter,
  HelpCircle,
  RotateCcw,
  Hash
} from 'lucide-react';
import { fetchExactRhymes, fetchNearRhymes, fetchDefinitions, countSyllables } from '../utils/rhymeEngine';
import { RhymeResult, DefinitionResult } from '../types';

export const RhymeFinder: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'exact' | 'near' | 'def'>('exact');
  const [syllableFilter, setSyllableFilter] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [exactResults, setExactResults] = useState<RhymeResult[]>([]);
  const [nearResults, setNearResults] = useState<RhymeResult[]>([]);
  const [defResults, setDefResults] = useState<DefinitionResult[]>([]);
  const [searchedWord, setSearchedWord] = useState('');
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const handleSearch = async (e?: React.FormEvent, overrideTerm?: string) => {
    if (e) e.preventDefault();
    const term = (overrideTerm !== undefined ? overrideTerm : searchTerm).trim().toLowerCase();
    if (!term) return;

    setSearchedWord(term);
    setIsLoading(true);
    const requestId = ++requestIdRef.current;

    try {
      const [exacts, nears, defs] = await Promise.all([
        fetchExactRhymes(term),
        fetchNearRhymes(term),
        fetchDefinitions(term),
      ]);
      if (requestId === requestIdRef.current) {
        setExactResults(exacts);
        setNearResults(nears);
        setDefResults(defs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const handleCopy = (word: string) => {
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 1500);
  };

  const handleDownloadList = () => {
    const list = activeTab === 'exact' ? exactResults : nearResults;
    const content = `Rhymes for "${searchedWord}" (${activeTab === 'exact' ? 'Exact' : 'Near'}):\n\n` +
      list.map((r) => `${r.word} (${r.numSyllables} syllables)`).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rhymes_${searchedWord}_${activeTab}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentList = activeTab === 'exact' ? exactResults : nearResults;
  const filteredList = syllableFilter === 'all'
    ? currentList
    : currentList.filter((r) => r.numSyllables === syllableFilter);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Search Bar Header */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs font-mono text-white/40 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>rhyme & near-rhyme standalone search</span>
          </div>
          <span className="text-white/40">phonetic & syllable filter engine</span>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="rhyme-standalone-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="enter target word (e.g. ignite, motion, night, dream)..."
              className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="rhyme-search-submit-btn"
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2 shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>find rhymes</span>
          </button>
        </form>

        {/* Quick Example Words */}
        <div className="flex items-center gap-2 text-xs font-mono text-white/40 overflow-x-auto pt-1">
          <span>popular:</span>
          {['motion', 'ignite', 'gravity', 'shadow', 'silent', 'forever'].map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => {
                setSearchTerm(word);
                handleSearch(undefined, word);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#050505] hover:bg-white/5 text-white/60 hover:text-emerald-400 border border-white/5 cursor-pointer text-xs"
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {searchedWord && (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-5 shadow-xl">
          {/* Result Tabs & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-[#050505] p-1 rounded-xl border border-white/5 text-xs font-mono">
              <button
                id="rhyme-tab-exact"
                onClick={() => setActiveTab('exact')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider ${activeTab === 'exact'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'text-white/40 hover:text-white'
                  }`}
              >
                <span>exact rhymes</span>
                <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
                  {exactResults.length}
                </span>
              </button>

              <button
                id="rhyme-tab-near"
                onClick={() => setActiveTab('near')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider ${activeTab === 'near'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'text-white/40 hover:text-white'
                  }`}
              >
                <span>near / slant</span>
                <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
                  {nearResults.length}
                </span>
              </button>

              <button
                id="rhyme-tab-def"
                onClick={() => setActiveTab('def')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider ${activeTab === 'def'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'text-white/40 hover:text-white'
                  }`}
              >
                <span>definitions</span>
                <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
                  {defResults.length}
                </span>
              </button>
            </div>

            {/* Syllable Filter & Download */}
            <div className="flex items-center gap-2">
              {activeTab !== 'def' && (
                <div className="flex items-center gap-1 bg-[#050505] p-1 rounded-xl border border-white/5 text-[11px] font-mono">
                  <Filter className="w-3 h-3 text-white/40 ml-1" />
                  {(['all', 1, 2, 3, 4] as const).map((syl) => (
                    <button
                      key={syl}
                      onClick={() => setSyllableFilter(syl)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${syllableFilter === syl
                          ? 'bg-white/10 text-emerald-400 font-bold'
                          : 'text-white/40 hover:text-white'
                        }`}
                    >
                      {syl === 'all' ? 'all' : `${syl} syl`}
                    </button>
                  ))}
                </div>
              )}

              {activeTab !== 'def' && filteredList.length > 0 && (
                <button
                  onClick={handleDownloadList}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  title="Download rhyme list"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">export .txt</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Content Display */}
          {activeTab === 'def' ? (
            <div className="space-y-2.5">
              {defResults.length > 0 ? (
                defResults.map((d, i) => (
                  <div key={i} className="bg-[#050505] border border-white/5 p-4 rounded-xl space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-white">{searchedWord}</span>
                      {d.partOfSpeech && (
                        <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-400 font-mono text-[10px] lowercase border border-white/5">
                          {d.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/80 font-sans leading-relaxed">{d.definition}</p>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-xs font-mono text-white/40">
                  no dictionary definition found for "{searchedWord}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-white/40">
                <span>showing {filteredList.length} matching words</span>
                <span>click word to copy</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {filteredList.map((item, idx) => {
                  const isCopied = copiedWord === item.word;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleCopy(item.word)}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#050505] hover:bg-white/5 border border-white/5 hover:border-emerald-500/40 text-white transition-all font-mono text-xs cursor-pointer"
                    >
                      <span className="font-medium group-hover:text-emerald-400">{item.word}</span>
                      <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.2 rounded">
                        {item.numSyllables}s
                      </span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredList.length === 0 && (
                <div className="text-center py-10 text-xs font-mono text-white/40 space-y-1">
                  <p>no rhymes match the selected syllable filter ({syllableFilter} syllables).</p>
                  <button
                    onClick={() => setSyllableFilter('all')}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    show all syllables →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
