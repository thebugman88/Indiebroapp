// Real-time phonetics and syllable density analyzer for Semantic Lab HUD

export function countSyllablesInWord(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;
  
  const formatted = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');
  
  const matches = formatted.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export function analyzeTextDensity(text: string): {
  totalWords: number;
  totalSyllables: number;
  linesCount: number;
  syllablesPerLine: number[];
  rhymeDensityPct: number;
  avgSyllablesPerWord: number;
  cadenceGrade: 'ACCELERATED' | 'BALANCED' | 'POCKET_HEAVY' | 'SPARSE';
  rhymePairsDetected: Array<{ word1: string; word2: string; similarity: number }>;
} {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      totalWords: 0,
      totalSyllables: 0,
      linesCount: 0,
      syllablesPerLine: [],
      rhymeDensityPct: 0,
      avgSyllablesPerWord: 0,
      cadenceGrade: 'SPARSE',
      rhymePairsDetected: [],
    };
  }

  let totalWords = 0;
  let totalSyllables = 0;
  const syllablesPerLine: number[] = [];
  const endWords: string[] = [];

  lines.forEach(line => {
    const words = line.trim().split(/\s+/).filter(w => w.length > 0);
    totalWords += words.length;
    let lineSyllables = 0;
    words.forEach(w => {
      lineSyllables += countSyllablesInWord(w);
    });
    syllablesPerLine.push(lineSyllables);
    totalSyllables += lineSyllables;
    if (words.length > 0) {
      endWords.push(words[words.length - 1].toLowerCase().replace(/[^a-z]/g, ''));
    }
  });

  // Calculate approximate rhyme similarity between end words and internal words
  const rhymePairsDetected: Array<{ word1: string; word2: string; similarity: number }> = [];
  let rhymeMatches = 0;

  for (let i = 0; i < endWords.length; i++) {
    for (let j = i + 1; j < endWords.length; j++) {
      const w1 = endWords[i];
      const w2 = endWords[j];
      if (w1.length >= 2 && w2.length >= 2) {
        const tail1 = w1.slice(-3);
        const tail2 = w2.slice(-3);
        const shortTail1 = w1.slice(-2);
        const shortTail2 = w2.slice(-2);

        if (tail1 === tail2 && tail1.length >= 2) {
          rhymeMatches += 2;
          rhymePairsDetected.push({ word1: w1, word2: w2, similarity: 0.95 });
        } else if (shortTail1 === shortTail2 && shortTail1.length >= 2) {
          rhymeMatches += 1.2;
          rhymePairsDetected.push({ word1: w1, word2: w2, similarity: 0.75 });
        }
      }
    }
  }

  const baselinePossiblePairs = Math.max(1, endWords.length - 1);
  const rawDensity = (rhymeMatches / baselinePossiblePairs) * 45 + (totalSyllables / Math.max(1, totalWords)) * 25;
  const rhymeDensityPct = Math.min(99.4, Math.max(12, Math.round(rawDensity)));

  const avgSyllablesPerWord = totalWords > 0 ? Number((totalSyllables / totalWords).toFixed(2)) : 0;

  let cadenceGrade: 'ACCELERATED' | 'BALANCED' | 'POCKET_HEAVY' | 'SPARSE' = 'BALANCED';
  if (totalWords < 4) cadenceGrade = 'SPARSE';
  else if (avgSyllablesPerWord > 1.7 || (syllablesPerLine[0] || 0) > 16) cadenceGrade = 'ACCELERATED';
  else if (avgSyllablesPerWord >= 1.25) cadenceGrade = 'POCKET_HEAVY';

  return {
    totalWords,
    totalSyllables,
    linesCount: lines.length,
    syllablesPerLine,
    rhymeDensityPct,
    avgSyllablesPerWord,
    cadenceGrade,
    rhymePairsDetected,
  };
}
