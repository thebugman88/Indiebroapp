import { cancellableAttempt, CancellationUnconfirmed, ProviderDeadline } from './aiCancellation';
import { GoogleGenAI } from '@google/genai';

export interface ResilientAiOptions {
  prompt?: string;
  systemInstruction?: string;
  parts?: any[];
  responseMimeType?: 'application/json' | 'text/plain';
  responseSchema?: any;
  models?: string[];
  maxRetriesPerModel?: number;
  temperature?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  maxOutputTokens?: number;
}

export interface AttemptLog {
  model: string;
  attempt: number;
  status: 'SUCCESS' | 'RATE_LIMITED_429' | 'UNAVAILABLE_503' | 'TIMEOUT' | 'ERROR';
  durationMs: number;
  error?: string;
}

export interface ResilientAiResult<T = any> {
  success: boolean;
  rawText: string;
  data?: T;
  modelUsed: string;
  fallbackTriggered: boolean;
  attemptHistory: AttemptLog[];
  totalDurationMs: number;
}

// Default multi-model fallback chain for indiebrotherhood
export const DEFAULT_MODEL_CHAIN = [
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
];

/**
 * Lazy Gemini client initializer
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'indiebrotherhood-resilience-gateway/2026',
      },
    },
  });
}

/**
 * Light JSON repair helper to auto-heal malformed or markdown-wrapped AI responses
 */
export function sanitizeAndParseJson<T = any>(text: string): T {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (initialErr) {
    // Attempt auto-repair on common JSON syntax issues
    let repaired = cleaned;
    
    // Fix trailing commas before closing braces/brackets
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    // Auto-close open braces if truncated
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }

    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }

    return JSON.parse(repaired) as T;
  }
}

/**
 * Execute AI request with multi-model fallback, exponential backoff, and consistent response formatting
 */
export async function executeResilientAi<T = any>(
  options: ResilientAiOptions
): Promise<ResilientAiResult<T>> {
  const startTime = Date.now();
  const client = getGeminiClient();

  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured or invalid in environment.');
  }

  const modelChain = options.models && options.models.length > 0
    ? options.models
    : DEFAULT_MODEL_CHAIN;

  const maxRetries = options.maxRetriesPerModel ?? 1;
  const timeoutMs = options.timeoutMs ?? 25000;
  const attemptHistory: AttemptLog[] = [];

  let lastError: any = null;

  for (let mIdx = 0; mIdx < modelChain.length; mIdx++) {
    const currentModel = modelChain[mIdx];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const attemptStart = Date.now();
      try {
        // Construct request payload
        const contentParts: any[] = [];
        if (options.parts && options.parts.length > 0) {
          contentParts.push(...options.parts);
        }
        if (options.prompt) {
          contentParts.push({ text: options.prompt });
        }

        const config: any = {};
        if(options.maxOutputTokens)config.maxOutputTokens=options.maxOutputTokens;
        if (options.responseMimeType) {
          config.responseMimeType = options.responseMimeType;
        }
        if (options.responseSchema) {
          config.responseSchema = options.responseSchema;
        }
        if (typeof options.temperature === 'number') {
          config.temperature = options.temperature;
        }
        if (options.systemInstruction) {
          config.systemInstruction = options.systemInstruction;
        }

        // Run with timeout wrapper
        const response: any = await cancellableAttempt(signal => client.models.generateContent({
          model: currentModel,
          contents: contentParts.length === 1 && typeof contentParts[0].text === 'string' && !options.parts
            ? contentParts[0].text : { parts: contentParts },
          config: { ...config, abortSignal: signal },
        }), timeoutMs, options.signal);
        const rawText = response.text || '';
        const attemptDuration = Date.now() - attemptStart;

        attemptHistory.push({
          model: currentModel,
          attempt,
          status: 'SUCCESS',
          durationMs: attemptDuration,
        });

        let parsedData: T | undefined = undefined;
        if (options.responseMimeType === 'application/json' || options.responseSchema) {
          parsedData = sanitizeAndParseJson<T>(rawText);
        }

        return {
          success: true,
          rawText,
          data: parsedData,
          modelUsed: currentModel,
          fallbackTriggered: mIdx > 0,
          attemptHistory,
          totalDurationMs: Date.now() - startTime,
        };
      } catch (err: any) {
        if (err instanceof CancellationUnconfirmed || err instanceof ProviderDeadline || options.signal?.aborted) throw new Error("AI request canceled or timed out; no fallback started.");
        const attemptDuration = Date.now() - attemptStart;
        const errMsg = err?.message || String(err);
        const errStatus = err?.status || err?.statusCode || 500;

        let statusType: AttemptLog['status'] = 'ERROR';
        const is429 = errStatus === 429 || errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate');
        const is503 = errStatus === 503 || errMsg.includes('503') || errMsg.toLowerCase().includes('overloaded') || errMsg.toLowerCase().includes('unavailable');
        const isTimeout = errMsg.toLowerCase().includes('timeout') || errStatus === 504;
        if(isTimeout)throw new Error('AI provider timed out; no additional generation started.');

        if (is429) statusType = 'RATE_LIMITED_429';
        else if (is503) statusType = 'UNAVAILABLE_503';
        else if (isTimeout) statusType = 'TIMEOUT';

        attemptHistory.push({
          model: currentModel,
          attempt,
          status: statusType,
          durationMs: attemptDuration,
          error: errMsg,
        });

        lastError = err;

        // Apply backoff before next retry or model step
        const backoffTime = Math.min(200 * Math.pow(2, attempt) + Math.random() * 100, 1500);
        await new Promise((r) => setTimeout(r, backoffTime));

        // If rate limited or unavailable, immediately break to next model tier
        if (is429 || is503 || isTimeout) {
          break;
        }
      }
    }
  }

  // If all models in the chain fail, throw a detailed resiliency exception
  const totalDuration = Date.now() - startTime;
  const failureSummary = attemptHistory
    .map((h) => `${h.model} (attempt ${h.attempt}): ${h.status} [${h.durationMs}ms] - ${h.error || 'unknown'}`)
    .join(' | ');

  throw new Error(`All resilient AI model tiers exhausted (${totalDuration}ms): ${failureSummary}. Last Error: ${lastError?.message || 'Unknown failure'}`);
}
