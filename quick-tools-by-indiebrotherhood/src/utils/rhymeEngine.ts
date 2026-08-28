import { RhymeResult, DefinitionResult } from '../types';

// Fast rule-based heuristic syllable counter
export function countSyllables(word: string): number {
  if (!word) return 0;
  const cleanWord = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!cleanWord) return 0;
  if (cleanWord.length <= 3) return 1;

  // Specific common words/exceptions
  const exceptions: Record<string, number> = {
    the: 1, to: 1, you: 1, love: 1, rhyme: 1, fire: 1, poem: 2, rhythm: 2,
    music: 2, heaven: 2, seven: 2, eleven: 3, everything: 3, beautiful: 3,
    different: 2, family: 3, favorite: 3, memory: 3, history: 3,
  };
  if (exceptions[cleanWord]) return exceptions[cleanWord];

  let cleaned = cleanWord;
  // Suffix rules
  cleaned = cleaned.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  cleaned = cleaned.replace(/^y/, '');

  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  const count = matches ? matches.length : 1;
  return Math.max(1, count);
}

export function countLineSyllables(line: string): number {
  if (!line || !line.trim()) return 0;
  const words = line.trim().split(/\s+/);
  return words.reduce((acc, word) => acc + countSyllables(word), 0);
}

// Extract last cleaned word from a line
export function getLastWord(line: string): string {
  if (!line || !line.trim()) return '';
  const words = line.trim().split(/\s+/);
  const last = words[words.length - 1];
  return last.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

// Phonetic ending signature for rhyme clustering
export function getRhymeSignature(word: string): string {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return '';
  if (clean.length <= 2) return clean;

  // Normalize common phonetic endings
  if (clean.endsWith('ight') || clean.endsWith('ite')) return 'ITE';
  if (clean.endsWith('tion') || clean.endsWith('sion')) return 'SHUN';
  if (clean.endsWith('ay') || clean.endsWith('ey') || clean.endsWith('eigh')) return 'AY';
  if (clean.endsWith('ee') || clean.endsWith('ea') || clean.endsWith('y')) return 'EE';
  if (clean.endsWith('ow') || clean.endsWith('oe') || clean.endsWith('ough')) return 'OH';
  if (clean.endsWith('ound') || clean.endsWith('owned')) return 'OUND';
  if (clean.endsWith('ing') || clean.endsWith('in')) return 'ING';
  if (clean.endsWith('ame') || clean.endsWith('aim')) return 'AYM';
  if (clean.endsWith('art') || clean.endsWith('eart')) return 'ART';
  if (clean.endsWith('one') || clean.endsWith('own')) return 'OHN';
  if (clean.endsWith('ine') || clean.endsWith('ign')) return 'EYEN';
  if (clean.endsWith('ake') || clean.endsWith('eak')) return 'AYK';
  if (clean.endsWith('all') || clean.endsWith('awl')) return 'ALL';
  if (clean.endsWith('old') || clean.endsWith('oled')) return 'OHLD';
  if (clean.endsWith('ave') || clean.endsWith('aive')) return 'AYV';
  if (clean.endsWith('eam') || clean.endsWith('eme')) return 'EEM';
  if (clean.endsWith('out') || clean.endsWith('oubt')) return 'OWT';
  if (clean.endsWith('air') || clean.endsWith('are') || clean.endsWith('ear')) return 'AIR';
  if (clean.endsWith('oor') || clean.endsWith('ore') || clean.endsWith('our')) return 'ORE';
  if (clean.endsWith('ace') || clean.endsWith('ase')) return 'AYS';
  if (clean.endsWith('ide') || clean.endsWith('ied')) return 'EYED';
  if (clean.endsWith('ice') || clean.endsWith('ise')) return 'EYES';
  if (clean.endsWith('end') || clean.endsWith('enned')) return 'END';
  if (clean.endsWith('ack') || clean.endsWith('ak')) return 'ACK';

  // Default fallback: last 2-3 characters
  return clean.slice(-Math.min(clean.length, 3)).toUpperCase();
}

// Preset color tags for matching rhyme groups
export const RHYME_PALETTE = [
  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', indicator: '#10b981', label: 'Group A' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', indicator: '#06b6d4', label: 'Group B' },
  { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', indicator: '#f59e0b', label: 'Group C' },
  { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30', indicator: '#8b5cf6', label: 'Group D' },
  { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', indicator: '#f43f5e', label: 'Group E' },
  { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30', indicator: '#6366f1', label: 'Group F' },
  { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30', indicator: '#14b8a6', label: 'Group G' },
  { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', indicator: '#d946ef', label: 'Group H' },
];

export interface AnalyzedLine {
  id: string;
  lineNumber: number;
  text: string;
  syllables: number;
  lastWord: string;
  rhymeSig: string;
  rhymeGroupIndex: number | null; // index into RHYME_PALETTE or null if unique
  isRhymeMatch: boolean;
}

export function analyzeLyrics(text: string): AnalyzedLine[] {
  const lines = text.split('\n');
  const rawAnalyzed = lines.map((line, idx) => {
    const lastWord = getLastWord(line);
    const rhymeSig = lastWord ? getRhymeSignature(lastWord) : '';
    const syllables = countLineSyllables(line);
    return {
      id: `line-${idx}`,
      lineNumber: idx + 1,
      text: line,
      syllables,
      lastWord,
      rhymeSig,
      rhymeGroupIndex: null as number | null,
      isRhymeMatch: false,
    };
  });

  // Count occurrences of each rhyme signature
  const sigCounts: Record<string, number> = {};
  for (const item of rawAnalyzed) {
    if (item.rhymeSig) {
      sigCounts[item.rhymeSig] = (sigCounts[item.rhymeSig] || 0) + 1;
    }
  }

  // Assign distinct colors to signatures that occur 2+ times
  const sigToColorIndex: Record<string, number> = {};
  let colorCounter = 0;

  for (const [sig, count] of Object.entries(sigCounts)) {
    if (count >= 2) {
      sigToColorIndex[sig] = colorCounter % RHYME_PALETTE.length;
      colorCounter++;
    }
  }

  return rawAnalyzed.map((item) => {
    if (item.rhymeSig && sigToColorIndex[item.rhymeSig] !== undefined) {
      return {
        ...item,
        rhymeGroupIndex: sigToColorIndex[item.rhymeSig],
        isRhymeMatch: true,
      };
    }
    return item;
  });
}

// Datamuse API fetchers with caching
const rhymeCache = new Map<string, RhymeResult[]>();
const nearRhymeCache = new Map<string, RhymeResult[]>();
const defCache = new Map<string, DefinitionResult[]>();

export async function fetchExactRhymes(word: string): Promise<RhymeResult[]> {
  const clean = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!clean) return [];

  const cacheKey = `exact_${clean}`;
  if (rhymeCache.has(cacheKey)) {
    return rhymeCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(clean)}&md=sd&max=60`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    const results: RhymeResult[] = data.map((item: { word: string; numSyllables?: number; score?: number; defs?: string[]; tags?: string[] }) => ({
      word: item.word,
      numSyllables: item.numSyllables || countSyllables(item.word),
      score: item.score,
      defs: item.defs,
      tags: item.tags,
    }));
    rhymeCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.warn('Datamuse API offline or blocked, using heuristic generator:', error);
    return generateFallbackRhymes(clean, 'exact');
  }
}

export async function fetchNearRhymes(word: string): Promise<RhymeResult[]> {
  const clean = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!clean) return [];

  const cacheKey = `near_${clean}`;
  if (nearRhymeCache.has(cacheKey)) {
    return nearRhymeCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(`https://api.datamuse.com/words?rel_nry=${encodeURIComponent(clean)}&md=sd&max=60`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    const results: RhymeResult[] = data.map((item: { word: string; numSyllables?: number; score?: number; defs?: string[]; tags?: string[] }) => ({
      word: item.word,
      numSyllables: item.numSyllables || countSyllables(item.word),
      score: item.score,
      defs: item.defs,
      tags: item.tags,
    }));
    nearRhymeCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.warn('Datamuse API offline, using fallback near rhymes:', error);
    return generateFallbackRhymes(clean, 'near');
  }
}

export async function fetchDefinitions(word: string): Promise<DefinitionResult[]> {
  const clean = word.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (!clean) return [];

  const cacheKey = `def_${clean}`;
  if (defCache.has(cacheKey)) {
    return defCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(clean)}&md=d&max=1`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    const defs: DefinitionResult[] = [];
    if (data && data[0] && Array.isArray(data[0].defs)) {
      for (const d of data[0].defs) {
        const parts = d.split('\t');
        const pos = parts.length > 1 ? parts[0] : '';
        const def = parts.length > 1 ? parts[1] : parts[0];
        defs.push({ word: clean, partOfSpeech: pos, definition: def });
      }
    }
    if (defs.length === 0) {
      // Fallback via free dictionary API
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
        if (dictRes.ok) {
          const dictData = await dictRes.json();
          if (Array.isArray(dictData) && dictData[0]?.meanings) {
            for (const meaning of dictData[0].meanings) {
              for (const d of meaning.definitions || []) {
                defs.push({
                  word: clean,
                  partOfSpeech: meaning.partOfSpeech,
                  definition: d.definition,
                });
              }
            }
          }
        }
      } catch {
        // pass
      }
    }
    defCache.set(cacheKey, defs);
    return defs;
  } catch (error) {
    console.warn('Definition API fetch error:', error);
    return [];
  }
}

// Fallback rhyme database for offline/quick use
function generateFallbackRhymes(word: string, type: 'exact' | 'near'): RhymeResult[] {
  const sig = getRhymeSignature(word);
  const commonBank: Record<string, string[]> = {
    ITE: ['night', 'light', 'bright', 'fight', 'sight', 'flight', 'tight', 'white', 'ignite', 'insight', 'delight', 'midnight'],
    AY: ['day', 'say', 'way', 'stay', 'play', 'away', 'may', 'gray', 'pray', 'decay', 'display', 'betray'],
    EE: ['see', 'free', 'tree', 'be', 'me', 'key', 'flee', 'plea', 'degree', 'guarantee', 'harmony', 'memory'],
    OH: ['go', 'slow', 'know', 'glow', 'show', 'blow', 'flow', 'below', 'although', 'shadow'],
    OUND: ['sound', 'ground', 'bound', 'round', 'found', 'profound', 'around', 'unbound'],
    ING: ['sing', 'ring', 'king', 'bring', 'wing', 'spring', 'thing', 'everything'],
    AYM: ['name', 'fame', 'game', 'flame', 'shame', 'claim', 'tame', 'frame'],
    ART: ['heart', 'start', 'part', 'art', 'smart', 'chart', 'apart', 'depart'],
    OHN: ['alone', 'stone', 'bone', 'zone', 'unknown', 'blown', 'shown', 'throne'],
    EYEN: ['mine', 'shine', 'line', 'fine', 'divine', 'combine', 'design', 'align'],
    AYK: ['break', 'make', 'take', 'wake', 'shake', 'ache', 'forsake', 'mistake'],
    ALL: ['call', 'fall', 'wall', 'small', 'tall', 'all', 'recall', 'install'],
    OHLD: ['cold', 'gold', 'hold', 'told', 'bold', 'unfold', 'untold'],
    AYV: ['save', 'brave', 'wave', 'cave', 'grave', 'crave', 'behave'],
    EEM: ['dream', 'stream', 'beam', 'team', 'gleam', 'scheme', 'extreme', 'supreme'],
    OWT: ['shout', 'doubt', 'out', 'about', 'without', 'throughout'],
    AIR: ['care', 'dare', 'stare', 'air', 'fair', 'bear', 'aware', 'despair', 'declare'],
    ORE: ['door', 'more', 'floor', 'score', 'roar', 'shore', 'explore', 'before', 'forever'],
    AYS: ['face', 'place', 'grace', 'space', 'chase', 'trace', 'embrace', 'erase'],
    EYED: ['side', 'ride', 'hide', 'wide', 'guide', 'tide', 'inside', 'decide', 'provide'],
    EYES: ['eyes', 'rise', 'lies', 'skies', 'ties', 'disguise', 'surprise', 'realize'],
    END: ['friend', 'send', 'bend', 'mend', 'trend', 'depend', 'transcend', 'unwind'],
    ACK: ['track', 'back', 'black', 'pack', 'crack', 'attack', 'playback'],
  };

  const matches = commonBank[sig] || [];
  const filtered = matches.filter((w) => w !== word);
  if (type === 'near') {
    // add variations
    return filtered.slice(0, 15).map((w) => ({
      word: w,
      numSyllables: countSyllables(w),
      score: 80,
    }));
  }
  return filtered.map((w) => ({
    word: w,
    numSyllables: countSyllables(w),
    score: 100,
  }));
}
