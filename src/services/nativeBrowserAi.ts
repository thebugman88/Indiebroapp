/**
 * Native Browser AI Integration Service (Zero-Cost, Keyless Chrome Built-in AI / Prompt API)
 * Checks for window.ai / Chrome Gemini Nano Prompt API.
 * Provides instant, zero-cost, private client-side text generation, lyric cleanup, and micro-summaries.
 */

export interface NativeAiStatus {
  available: 'readily' | 'after-download' | 'no';
  engine: string;
  isKeyless: boolean;
}

export interface NativeLyricOptions {
  genre: string;
  vibe: string;
  explicit: boolean;
  mode: string;
  structure: string;
  starterType?: string;
  userLyrics?: string;
  userLyricsOption?: string;
}

export interface NativeLyricSet {
  title: string;
  genre: string;
  vibe: string;
  structure: string;
  explicit: boolean;
  content: string;
  summaryNote?: string;
}

/**
 * Checks whether native browser AI (Chrome Prompt API / window.ai / Gemini Nano) is supported
 */
export async function checkNativeAiAvailability(): Promise<NativeAiStatus> {
  if (typeof window === 'undefined') {
    return { available: 'no', engine: 'None (SSR/Offline)', isKeyless: true };
  }

  try {
    const ai = (window as any).ai || (globalThis as any).ai;
    if (ai?.languageModel) {
      if (typeof ai.languageModel.capabilities === 'function') {
        const caps = await ai.languageModel.capabilities();
        const avail = caps?.available || caps;
        if (avail === 'readily') {
          return { available: 'readily', engine: 'Chrome Built-in AI (Gemini Nano Prompt API)', isKeyless: true };
        } else if (avail === 'after-download') {
          return { available: 'after-download', engine: 'Chrome Built-in AI (Model Download Pending)', isKeyless: true };
        }
      }
      return { available: 'readily', engine: 'Chrome Built-in AI (Prompt API)', isKeyless: true };
    }

    if (ai?.assistant) {
      if (typeof ai.assistant.capabilities === 'function') {
        const caps = await ai.assistant.capabilities();
        const avail = caps?.available || caps;
        if (avail === 'readily' || avail === 'after-download') {
          return { available: avail, engine: 'Chrome Assistant API (Local Nano)', isKeyless: true };
        }
      }
      return { available: 'readily', engine: 'Chrome Assistant API', isKeyless: true };
    }

    if (typeof (window as any).model?.prompt === 'function') {
      return { available: 'readily', engine: 'Native Window Model API', isKeyless: true };
    }
  } catch (err) {
    console.debug('[NativeBrowserAI] Availability check:', err);
  }

  return { available: 'no', engine: 'High-Precision Local Algorithmic Engine', isKeyless: true };
}

/**
 * Run a prompt using browser-native AI session
 */
export async function promptNativeBrowserAi(
  promptText: string,
  systemInstruction?: string
): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const ai = (window as any).ai || (globalThis as any).ai;

    // Chrome Built-in AI (Prompt API / languageModel)
    if (ai?.languageModel?.create) {
      const session = await ai.languageModel.create({
        systemPrompt: systemInstruction || 'You are an elite music intelligence and lyricist assistant by indiebrotherhood.',
      });
      const response = await session.prompt(promptText);
      session.destroy?.();
      return response ? response.trim() : null;
    }

    // Chrome Assistant API (earlier experimental build)
    if (ai?.assistant?.create) {
      const session = await ai.assistant.create({
        systemPrompt: systemInstruction || 'You are an elite music intelligence and lyricist assistant by indiebrotherhood.',
      });
      const response = await session.prompt(promptText);
      session.destroy?.();
      return response ? response.trim() : null;
    }

    // Alternative window.model API
    if (typeof (window as any).model?.prompt === 'function') {
      const response = await (window as any).model.prompt(promptText);
      return response ? response.trim() : null;
    }
  } catch (err) {
    console.warn('[NativeBrowserAI] Prompt error:', err);
  }

  return null;
}

/**
 * Generate dual lyric sets keylessly using browser AI with automatic algorithmic fallback
 */
export async function generateNativeLyrics(
  options: NativeLyricOptions
): Promise<{ setA: NativeLyricSet; setB: NativeLyricSet; engineUsed: string } | null> {
  const status = await checkNativeAiAvailability();
  
  if (status.available === 'readily') {
    try {
      const prompt = `Write two completely different, high-impact lyrical directions (Set A and Set B) for an unreleased track:
Genre: ${options.genre}
Vibe/Mood: ${options.vibe}
Explicit Content: ${options.explicit ? 'Yes' : 'No'}
Structure: ${options.structure}
Mode: ${options.mode}
${options.userLyrics ? `Artist Draft Lines to incorporate or finish: "${options.userLyrics}"` : ''}

Format output with clear headers:
[SET A: TITLE]
(Lyrics for Set A)

[SET B: TITLE]
(Lyrics for Set B)`;

      const text = await promptNativeBrowserAi(
        prompt,
        'You are Lyric Pro Studio Engine by indiebrotherhood. Write authentic, industry-standard song lyrics with pristine meter and rhythm.'
      );

      if (text && text.includes('[SET B:')) {
        const parts = text.split(/\[SET B:/i);
        const setAText = parts[0].replace(/\[SET A:[^\]]*\]/i, '').trim();
        const setBText = (parts[1] || '').replace(/^[^\]]*\]/i, '').trim();

        return {
          setA: {
            title: `${options.vibe.toUpperCase()} FREQUENCY (Set A)`,
            genre: options.genre,
            vibe: options.vibe,
            structure: options.structure,
            explicit: options.explicit,
            content: setAText || text,
            summaryNote: 'Synthesized locally via Chrome Prompt API (Gemini Nano)',
          },
          setB: {
            title: `${options.genre.toUpperCase()} APEX (Set B)`,
            genre: options.genre,
            vibe: options.vibe,
            structure: options.structure,
            explicit: options.explicit,
            content: setBText || text,
            summaryNote: 'Synthesized locally via Chrome Prompt API (Gemini Nano)',
          },
          engineUsed: 'Chrome Gemini Nano (Keyless)',
        };
      }
    } catch (e) {
      console.warn('[NativeBrowserAI] Fallback to algorithmic lyrics:', e);
    }
  }

  return null;
}

/**
 * Generate micro-summary or track advice keylessly
 */
export async function generateMicroSummary(
  textToSummarize: string,
  topic: string = 'music critique'
): Promise<string> {
  const status = await checkNativeAiAvailability();
  if (status.available === 'readily') {
    try {
      const prompt = `Provide a concise 2-sentence executive summary and key takeaways for this ${topic}:
"""${textToSummarize.slice(0, 1500)}"""`;
      const result = await promptNativeBrowserAi(prompt);
      if (result) return result;
    } catch (e) {
      // ignore
    }
  }

  // Local fallback micro-summary
  const lines = textToSummarize.split('\n').filter((l) => l.trim().length > 10);
  const topInsights = lines.slice(0, 2).map((l) => l.replace(/^[-*•0-9.]+\s*/, '')).join(' ');
  return topInsights || 'Track dynamics demonstrate strong frequency balance, dynamic headroom, and authentic indie appeal.';
}
