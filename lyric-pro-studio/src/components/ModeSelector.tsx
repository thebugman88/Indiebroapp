import React from 'react';
import { Sliders, Sparkles, Wand2, Disc, Dice5, PenTool, Lightbulb, Zap, CheckCircle2 } from 'lucide-react';
import { CreationMode, StarterSection, UserLyricsOption } from '../types';

interface ModeSelectorProps {
  mode: CreationMode;
  starterType: StarterSection;
  userLyrics: string;
  userLyricsOption: UserLyricsOption;
  onSelectMode: (mode: CreationMode) => void;
  onSelectStarterType: (starter: StarterSection) => void;
  onUserLyricsChange: (text: string) => void;
  onUserLyricsOptionChange: (option: UserLyricsOption) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  starterType,
  userLyrics,
  userLyricsOption,
  onSelectMode,
  onSelectStarterType,
  onUserLyricsChange,
  onUserLyricsOptionChange
}) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
        <Sliders className="w-4 h-4" />
        3. Lyric Output Mode
      </label>

      <div className="space-y-2.5">
        
        {/* OPTION 1: 6 STRONG LYRIC SUGGESTIONS */}
        <div
          onClick={() => onSelectMode('ideas_6')}
          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
            mode === 'ideas_6'
              ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'ideas_6' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">6 Strong Lyric Suggestions / Ideas</div>
              <div className="text-[11px] text-zinc-400">Outputs 6 elite standalone punchlines & bar ideas per set</div>
            </div>
          </div>
          <input
            type="radio"
            name="creationMode"
            checked={mode === 'ideas_6'}
            onChange={() => onSelectMode('ideas_6')}
            className="accent-amber-400 w-4 h-4"
          />
        </div>

        {/* OPTION 2: VERSE OR CHORUS STARTER ONLY */}
        <div
          onClick={() => onSelectMode('starter')}
          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
            mode === 'starter'
              ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'starter' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Start a Chorus or Verse Only</div>
              <div className="text-[11px] text-zinc-400">Generates a strong opening section to kick off writing</div>
            </div>
          </div>

          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={starterType}
              onChange={(e) => {
                onSelectStarterType(e.target.value as StarterSection);
                onSelectMode('starter');
              }}
              className="bg-zinc-950 text-xs text-amber-300 font-semibold border border-amber-500/40 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="verse">Verse Starter</option>
              <option value="chorus">Chorus Starter</option>
            </select>
            <input
              type="radio"
              name="creationMode"
              checked={mode === 'starter'}
              onChange={() => onSelectMode('starter')}
              className="accent-amber-400 w-4 h-4"
            />
          </div>
        </div>

        {/* OPTION 3: WRITE ME A FULL SONG */}
        <div
          onClick={() => onSelectMode('full_song')}
          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
            mode === 'full_song'
              ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'full_song' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Write Me a Top-Level Full Song</div>
              <div className="text-[11px] text-zinc-400">Complete multi-section track layout from Intro to Outro</div>
            </div>
          </div>
          <input
            type="radio"
            name="creationMode"
            checked={mode === 'full_song'}
            onChange={() => onSelectMode('full_song')}
            className="accent-amber-400 w-4 h-4"
          />
        </div>

        {/* OPTION 4: WORK WITH MY OWN LYRICS (NEW) */}
        <div
          onClick={() => onSelectMode('user_lyrics')}
          className={`p-3.5 rounded-xl border cursor-pointer transition space-y-3 ${
            mode === 'user_lyrics'
              ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                mode === 'user_lyrics' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
              }`}>
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  Work With My Own Lyrics / Ideas
                  <span className="text-[9px] bg-amber-400 text-zinc-950 px-1.5 py-0.2 rounded font-black">NEW</span>
                </div>
                <div className="text-[11px] text-zinc-400">Finish your draft, get next-line ideas, or elevate your pattern</div>
              </div>
            </div>
            <input
              type="radio"
              name="creationMode"
              checked={mode === 'user_lyrics'}
              onChange={() => onSelectMode('user_lyrics')}
              className="accent-amber-400 w-4 h-4"
            />
          </div>

          {/* EXPANDED CONTROLS WHEN USER_LYRICS IS SELECTED */}
          {mode === 'user_lyrics' && (
            <div className="pt-2 border-t border-amber-500/30 space-y-3" onClick={(e) => e.stopPropagation()}>
              
              {/* SUB-OPTION TOGGLES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUserLyricsOptionChange('finish_lyrics')}
                  className={`p-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition ${
                    userLyricsOption === 'finish_lyrics'
                      ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Finish My Lyrics</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUserLyricsOptionChange('ideas_from_lyrics')}
                  className={`p-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition ${
                    userLyricsOption === 'ideas_from_lyrics'
                      ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>Give Me Ideas</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUserLyricsOptionChange('enhance_pattern')}
                  className={`p-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition ${
                    userLyricsOption === 'enhance_pattern'
                      ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Elevate Pattern</span>
                </button>
              </div>

              {/* USER LYRICS INPUT TEXT AREA */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90 flex items-center justify-between">
                  <span>Enter Your Draft Lines / Lyrics:</span>
                  <span className="text-[9px] text-zinc-400 font-mono">
                    {userLyrics.length} chars
                  </span>
                </label>
                <textarea
                  value={userLyrics}
                  onChange={(e) => onUserLyricsChange(e.target.value)}
                  placeholder="Paste or type your lyrics/bars here...
e.g. 'Standing in the rain watching the city burn / Waiting for my time, waiting for my turn...'"
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition resize-none custom-scrollbar font-mono leading-relaxed"
                />
              </div>

            </div>
          )}
        </div>

        {/* OPTION 5: AUTO SELECT MODE */}
        <div
          onClick={() => onSelectMode('auto')}
          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
            mode === 'auto'
              ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'auto' ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Dice5 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Auto Select Mode (Randomized Synthesis)</div>
              <div className="text-[11px] text-zinc-400">Randomly matches genre/vibe and crafts dual lyrics instantly</div>
            </div>
          </div>
          <input
            type="radio"
            name="creationMode"
            checked={mode === 'auto'}
            onChange={() => onSelectMode('auto')}
            className="accent-amber-400 w-4 h-4"
          />
        </div>

      </div>
    </div>
  );
};

