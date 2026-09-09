import { usePrivateStorage } from '../../../shared/PrivateWorkspaceGate';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, 
  Mic, 
  MicOff, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Sliders, 
  Hash, 
  BookOpen, 
  RefreshCw, 
  CornerDownLeft,
  Volume2,
  HelpCircle,
  Eye,
  Edit3
} from 'lucide-react';
import { LyricMode } from '../types';
import { analyzeLyrics, RHYME_PALETTE, fetchExactRhymes, fetchNearRhymes, getLastWord, countLineSyllables } from '../utils/rhymeEngine';

interface LyricScratchpadProps {
  initialLyrics?: string;
  onLyricsChange?: (text: string) => void;
  isAutoSaveOn: boolean;
  onToggleAutoSave: (val: boolean) => void;
  lastSaved: Date | null;
}

const DEFAULT_SAMPLE_LYRICS = '';

export const LyricScratchpad: React.FC<LyricScratchpadProps> = ({
  initialLyrics = '',
  onLyricsChange,
  isAutoSaveOn,
  onToggleAutoSave,
  lastSaved,
}) => {
  const localStorage = usePrivateStorage();
  const [lyrics, setLyrics] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('indie_scratchpad_lyrics');
      return saved !== null ? saved : '';
    } catch {
      return '';
    }
  });

  const [mode, setMode] = useState<LyricMode>('guided');
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [activeLineIdx, setActiveLineIdx] = useState<number>(0);

  // Smart Assistant state
  const [smartCandidates, setSmartCandidates] = useState<{ word: string; numSyllables: number; type: 'exact' | 'near' }[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [onlineRhymes,setOnlineRhymes]=useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Update localStorage and parent
  const handleTextChange = (newText: string) => {
    setLyrics(newText);
    if (isAutoSaveOn) {
      try {
        localStorage.setItem('indie_scratchpad_lyrics', newText);
      } catch (e) {
        console.error(e);
      }
    }
    if (onLyricsChange) {
      onLyricsChange(newText);
    }
  };

  // Analyzed lines for Guided Mode
  const analyzedLines = useMemo(() => {
    return analyzeLyrics(lyrics);
  }, [lyrics]);

  // Total stats
  const stats = useMemo(() => {
    const lines = lyrics.split('\n').filter((l) => l.trim().length > 0);
    const words = lyrics.trim().split(/\s+/).filter((w) => w.length > 0);
    const chars = lyrics.length;
    return {
      lineCount: lines.length,
      wordCount: words.length,
      charCount: chars,
    };
  }, [lyrics]);

  // Voice dictation using Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setLyrics((prev) => {
            const separator = prev && !prev.endsWith('\n') ? '\n' : '';
            const updated = prev + separator + finalTranscript.trim();
            handleTextChange(updated);
            return updated;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied.');
        } else if (event.error === 'no-speech') {
          // ignore transient no-speech
        } else {
          setSpeechError(`Voice error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    setSpeechError(null);
    if (!recognitionRef.current) {
      setSpeechError('Web Speech API is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if(!window.confirm('Voice dictation may send your audio to your browser’s speech provider. Continue?'))return;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  // Trigger Smart Assistant based on active line's target word
  const activeLine = analyzedLines[activeLineIdx] || analyzedLines[analyzedLines.length - 1];
  const targetRhymeWord = activeLine ? activeLine.lastWord : '';

  useEffect(() => {
    let isCancelled = false;
    if (!targetRhymeWord || !onlineRhymes || mode !== 'guided') {
      setSmartCandidates([]);
      setIsSuggesting(false);
      return;
    }

    setIsSuggesting(true);
    Promise.all([
      fetchExactRhymes(targetRhymeWord),
      fetchNearRhymes(targetRhymeWord),
    ])
      .then(([exacts, nears]) => {
        if (isCancelled) return;
        const combined: { word: string; numSyllables: number; type: 'exact' | 'near' }[] = [
          ...exacts.slice(0, 15).map((e) => ({ word: e.word, numSyllables: e.numSyllables, type: 'exact' as const })),
          ...nears.slice(0, 10).map((n) => ({ word: n.word, numSyllables: n.numSyllables, type: 'near' as const })),
        ];
        // Deduplicate
        const seen = new Set<string>();
        const unique = combined.filter((c) => {
          if (seen.has(c.word.toLowerCase()) || c.word.toLowerCase() === targetRhymeWord.toLowerCase()) return false;
          seen.add(c.word.toLowerCase());
          return true;
        });
        setSmartCandidates(unique);
      })
      .catch((e) => console.warn(e))
      .finally(() => {
        if (!isCancelled) setIsSuggesting(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [targetRhymeWord,onlineRhymes,mode]);

  // Insert suggested word into lyrics
  const handleInsertCandidate = (word: string) => {
    const lines = lyrics.split('\n');
    if (activeLineIdx >= 0 && activeLineIdx < lines.length) {
      lines[activeLineIdx] = lines[activeLineIdx] ? `${lines[activeLineIdx]} ${word}` : word;
    } else {
      lines.push(word);
    }
    const updated = lines.join('\n');
    handleTextChange(updated);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([lyrics], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lyrics_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Clear all scratchpad lyrics?')) {
      handleTextChange('');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Controls Toolbar */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#050505] p-1 rounded-xl border border-white/5 text-xs font-mono">
          <button
            id="scratchpad-mode-free"
            onClick={() => setMode('free')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider ${
              mode === 'free'
                ? 'bg-white text-black font-bold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>free write</span>
          </button>
          <button
            id="scratchpad-mode-guided"
            onClick={() => setMode('guided')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider ${
              mode === 'guided'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>guided write</span>
          </button>
        </div>

        {/* Font Size & Voice Mic & Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Voice to text mic */}
          <button
            id="scratchpad-mic-btn"
            onClick={toggleListening}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 border transition-all cursor-pointer font-bold uppercase tracking-wider text-xs ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-500/20'
                : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
            }`}
            title="Voice-to-Text Dictation"
          >
            {isListening ? <Mic className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isListening ? 'listening...' : 'dictate'}</span>
          </button>

          {/* Copy Button */}
          <button
            id="scratchpad-copy-btn"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer font-bold uppercase tracking-wider text-xs"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'copied!' : 'copy'}</span>
          </button>

          {/* Download .txt */}
          <button
            id="scratchpad-download-btn"
            onClick={handleDownloadTxt}
            className="px-3 py-1.5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Download text file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>export .txt</span>
          </button>

          {/* Clear Button */}
          <button
            id="scratchpad-clear-btn"
            onClick={handleClear}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {speechError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-2.5 rounded-xl font-mono flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-rose-400 hover:text-rose-200">✕</button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Main Editor Column */}
        <div className={mode === 'guided' ? 'lg:col-span-8 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {mode === 'free' ? (
            /* Free Write Mode: Clean, distraction-free editor */
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="bg-[#080808] px-5 py-3 border-b border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
                <span className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-wider text-[11px]">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>free write mode</span>
                </span>
                <span>{stats.wordCount} words • {stats.lineCount} lines • {stats.charCount} chars</span>
              </div>
              <textarea
                id="scratchpad-textarea-free"
                ref={textareaRef}
                value={lyrics}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="type or dictate your song lyrics, verse, chorus, bridge ideas here..."
                rows={16}
                className="w-full bg-transparent p-5 sm:p-7 text-white font-mono text-sm leading-relaxed focus:outline-none resize-y min-h-[380px] selection:bg-emerald-500/30 selection:text-white placeholder-white/20"
              />
            </div>
          ) : (
            /* Guided Write Mode: Per-line syllable counts, End-Rhyme Color Tagging, Inline Assistant */
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="bg-[#080808] px-5 py-3 border-b border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
                <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>guided write (syllables & rhyme scheme)</span>
                </div>
                <span className="hidden sm:inline">{stats.wordCount} words • {stats.lineCount} lines</span>
              </div>

              {/* Guided Lines Interactive View */}
              <div className="p-4 sm:p-5 space-y-2 max-h-[520px] overflow-y-auto">
                {analyzedLines.map((line, idx) => {
                  const palette = line.rhymeGroupIndex !== null ? RHYME_PALETTE[line.rhymeGroupIndex] : null;
                  const isActive = activeLineIdx === idx;

                  return (
                    <div
                      key={line.id}
                      onClick={() => setActiveLineIdx(idx)}
                      className={`group flex items-center gap-2 sm:gap-3 p-2.5 rounded-xl transition-all border cursor-text ${
                        isActive
                          ? 'bg-white/5 border-emerald-500/40 shadow-sm'
                          : 'bg-[#080808] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Line Number */}
                      <span className="w-6 text-right text-[11px] font-mono text-white/30 select-none shrink-0">
                        {idx + 1}
                      </span>

                      {/* Syllable Counter Badge */}
                      <div 
                        className={`w-10 sm:w-12 text-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 transition-colors ${
                          line.syllables > 0 
                            ? 'bg-white/5 text-white/80 border border-white/10' 
                            : 'bg-white/5 text-white/20'
                        }`}
                        title={`${line.syllables} syllables`}
                      >
                        {line.syllables} <span className="text-[9px] font-normal text-white/40">syl</span>
                      </div>

                      {/* Line Text Input / Display */}
                      <input
                        type="text"
                        value={line.text}
                        onFocus={() => setActiveLineIdx(idx)}
                        onChange={(e) => {
                          const lines = lyrics.split('\n');
                          lines[idx] = e.target.value;
                          handleTextChange(lines.join('\n'));
                        }}
                        onKeyDown={(e) => {
                          const lines = lyrics.split('\n');
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            lines.splice(idx + 1, 0, '');
                            handleTextChange(lines.join('\n'));
                            setActiveLineIdx(idx + 1);
                          } else if (e.key === 'Backspace' && line.text === '' && lines.length > 1) {
                            e.preventDefault();
                            lines.splice(idx, 1);
                            handleTextChange(lines.join('\n'));
                            setActiveLineIdx(Math.max(0, idx - 1));
                          }
                        }}
                        placeholder="write line..."
                        className="flex-1 bg-transparent text-sm font-mono text-white focus:outline-none placeholder-white/20"
                      />

                      {/* End-Rhyme Color Tag / Scheme Indicator */}
                      {palette ? (
                        <div
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 border shrink-0 ${palette.bg} ${palette.text} ${palette.border}`}
                          title={`Rhyme Match (${line.lastWord}): ${palette.label}`}
                        >
                          <span 
                            className="w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: palette.indicator }} 
                          />
                          <span className="lowercase">{line.lastWord}</span>
                        </div>
                      ) : line.lastWord ? (
                        <span className="text-[11px] font-mono text-white/40 lowercase px-2 py-0.5 rounded bg-white/5 border border-white/5 shrink-0">
                          {line.lastWord}
                        </span>
                      ) : null}
                    </div>
                  );
                })}

                {/* Add new line button */}
                <button
                  id="scratchpad-add-line-btn"
                  onClick={() => {
                    const updated = lyrics ? `${lyrics}\n` : '';
                    handleTextChange(updated);
                    setActiveLineIdx(analyzedLines.length);
                  }}
                  className="w-full py-2.5 border border-dashed border-white/10 hover:border-white/20 rounded-xl text-xs font-mono text-white/40 hover:text-white transition-colors cursor-pointer text-center"
                >
                  + add new line
                </button>
              </div>

              {/* Raw Text View toggle/footer */}
              <div className="bg-[#080808] p-3.5 border-t border-white/5 text-[11px] font-mono text-white/40 flex items-center justify-between">
                <span>click any line to get smart rhyme candidates for its ending word</span>
                <button
                  onClick={() => setMode('free')}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  switch to full text editor →
                </button>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#111] border border-white/5 p-3 rounded-2xl">
              <span className="text-white/40 text-[10px] uppercase tracking-wider block">Total Words</span>
              <p className="text-lg font-bold text-white mt-0.5">{stats.wordCount}</p>
            </div>
            <div className="bg-[#111] border border-white/5 p-3 rounded-2xl">
              <span className="text-white/40 text-[10px] uppercase tracking-wider block">Total Lines</span>
              <p className="text-lg font-bold text-white mt-0.5">{stats.lineCount}</p>
            </div>
            <div className="bg-[#111] border border-white/5 p-3 rounded-2xl">
              <span className="text-white/40 text-[10px] uppercase tracking-wider block">Avg Syllables</span>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">
                {stats.lineCount > 0 ? (analyzedLines.reduce((a, b) => a + b.syllables, 0) / stats.lineCount).toFixed(1) : '0.0'}
              </p>
            </div>
            <div className="bg-[#111] border border-white/5 p-3 rounded-2xl">
              <span className="text-white/40 text-[10px] uppercase tracking-wider block">Rhyme Schemes</span>
              <p className="text-lg font-bold text-cyan-400 mt-0.5">
                {new Set(analyzedLines.filter(l => l.rhymeGroupIndex !== null).map(l => l.rhymeGroupIndex)).size}
              </p>
            </div>
          </div>
        </div>

        {/* Right / Smart Assistant Column (Active in Guided Mode) */}
        {mode === 'guided' && (
          <div className="lg:col-span-4 space-y-4">
            <label className="flex gap-2 text-xs text-white/70"><input type="checkbox" checked={onlineRhymes} onChange={e=>setOnlineRhymes(e.target.checked)}/>Enable online rhyme suggestions. This sends the current line’s last word to Datamuse; it is off by default.</label>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>rhyme assistant</span>
                </div>
                {targetRhymeWord && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
                    "{targetRhymeWord}"
                  </span>
                )}
              </div>

              <div className="text-xs text-white/50 font-sans">
                {targetRhymeWord ? (
                  <span>
                    Suggested rhyme candidates for line {activeLineIdx + 1} (ending in <strong>"{targetRhymeWord}"</strong>):
                  </span>
                ) : (
                  <span>Type a line ending word or select a line on the left to see live rhyme recommendations.</span>
                )}
              </div>

              {/* Candidate Chips List */}
              <div className="min-h-[220px] max-h-[360px] overflow-y-auto space-y-2 pr-1">
                {isSuggesting ? (
                  <div className="flex items-center justify-center py-10 text-white/40 gap-2 text-xs font-mono">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>finding matches...</span>
                  </div>
                ) : smartCandidates.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {smartCandidates.map((c, i) => (
                      <button
                        key={i}
                        id={`assistant-candidate-${i}`}
                        onClick={() => handleInsertCandidate(c.word)}
                        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                          c.type === 'exact'
                            ? 'bg-[#050505] hover:bg-emerald-500/20 text-white/90 hover:text-emerald-300 border-white/5 hover:border-emerald-500/40'
                            : 'bg-[#050505] hover:bg-cyan-500/20 text-white/80 hover:text-cyan-300 border-white/5 hover:border-cyan-500/40'
                        }`}
                        title={`Click to insert "${c.word}" into current line`}
                      >
                        <span className="font-medium">{c.word}</span>
                        <span className="text-[10px] text-white/30">{c.numSyllables}s</span>
                        <CornerDownLeft className="w-2.5 h-2.5 text-white/30 group-hover:text-emerald-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : targetRhymeWord ? (
                  <p className="text-center py-8 text-xs font-mono text-white/30">
                    no matches found for "{targetRhymeWord}". try phonetic alternative.
                  </p>
                ) : null}
              </div>

              {/* Rhyme Scheme Legend */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">rhyme scheme palette:</span>
                <div className="flex flex-wrap gap-1.5">
                  {RHYME_PALETTE.slice(0, 4).map((p, idx) => (
                    <span
                      key={idx}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${p.bg} ${p.text} ${p.border}`}
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
