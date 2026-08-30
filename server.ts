import { economyRouter, usageMiddleware, economyDb } from './server/economy';
import { startPaymentMonitor } from './server/payments';
import { PURCHASE_POLICY } from './shared/economy';
import { judgementRouter } from './server/judgement';
import { attachRealtime } from './server/realtime';
import { createMessagingRouter } from './server/messaging';
import { extraAiRouter } from './server/extraAi';
import { decodeAudioDataUrl, textField, safeId } from './server/media';
import { semanticRouter } from './server/semantic';
import { requireAuth, requireAdmin } from './server/auth';
import { createBillingRouter, createStripeWebhook } from './server/billing';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { createServer as createViteServer } from 'vite';
import { Type } from '@google/genai';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Import our modular backend engines
import {
  executeResilientAi,
  DEFAULT_MODEL_CHAIN,
  getGeminiClient,
} from './server/aiResilience';
import {
  codeSentinelMiddleware,
  getSecurityStats,
  getSecurityAuditLogs,
  remediateUnquarantineIp,
  recordAccountRequest,
  getAccountSecurityStatus,
  pauseAccount,
  unpauseAccount,
  getStartupSecurityGuidelines,
} from './server/codeSentinel';
import { generateAlgorithmicLyrics } from './lyric-pro-studio/src/data/lyricTemplates';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// -------------------------------------------------------------
// 1. STRIPE WEBHOOK RAW BUFFER HANDLER (MUST PRECEDE JSON PARSER)
// -------------------------------------------------------------
// Lazy Stripe Client Initialization
let stripeClient: Stripe | null = null;
const getStripeClient = (): Stripe | null => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey === 'MY_STRIPE_SECRET_KEY') {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
};

app.post('/api/stripe/webhook', ...createStripeWebhook(getStripeClient));

// -------------------------------------------------------------
// 2. GLOBAL PARSERS & CODE SENTINEL MONITORING MIDDLEWARE
// -------------------------------------------------------------


// Public metadata is explicitly allowlisted; every other API requires verified identity.
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' && ['/health', '/stripe/config', '/legal/terms'].includes(req.path)) return next();
  return requireAuth(req, res, next);
});
app.use(['/api/admin', '/api/audit', '/api/resilience'], requireAdmin);
app.use('/api/security', (req, res, next) => {
  if (req.method === 'GET' && req.path === '/account-status') return next();
  return requireAdmin(req, res, next);
});
// Authenticate before parsing large media payloads.
app.use(express.json({ limit: '22mb' }));
// Attach AI Code Sentinel & Threat Detection Observer
app.use('/api', codeSentinelMiddleware);
app.use('/api/stripe', createBillingRouter(getStripeClient));
app.use(usageMiddleware);
app.get('/api/legal/terms',(_req,res)=>res.type('text/plain').send('IndieBrotherhood — Purchase Terms and AI Disclosure\n\n'+PURCHASE_POLICY));
app.use('/api/economy',economyRouter);
app.use(semanticRouter);
app.use(extraAiRouter);
app.use('/api/dm', createMessagingRouter());
app.use('/api/judgement', judgementRouter);

const httpServer = createHttpServer(app);

// Health Check Endpoint with Resiliency & Security Telemetry
app.get('/api/health', (_req, res) => {
  const security = getSecurityStats();
  res.json({
    status: 'ok',
    suite: 'indiebrotherhood unified suite',
    timestamp: new Date().toISOString(),
    aiEngine: {
      available: !!process.env.GEMINI_API_KEY,
      primaryModel: DEFAULT_MODEL_CHAIN[0],
      fallbackChain: DEFAULT_MODEL_CHAIN,
    },
    stripeEngine: {
      configured: !!process.env.STRIPE_SECRET_KEY,
      webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    securitySentinel: {
      status: 'active',
      threatsBlocked: security.threatsBlocked,
      selfRepairsExecuted: security.selfRepairsExecuted,
      activeQuarantinedIps: security.activeQuarantinedIps,
      uptimeSeconds: security.uptimeSeconds,
    },
  });
});

// -------------------------------------------------------------
// 3. AI RESILIENCE & MULTI-MODEL METRICS API
// -------------------------------------------------------------
app.get('/api/resilience/status', (_req, res) => {
  res.json({
    activeModelChain: DEFAULT_MODEL_CHAIN,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    resiliencePolicy: {
      primaryModel: 'gemini-2.5-pro',
      fallbackModel1: 'gemini-2.5-flash',
      fallbackModel2: 'gemini-1.5-pro',
      fallbackModel3: 'gemini-1.5-flash',
      autoRetryOn429: true,
      autoRetryOn503: true,
      exponentialBackoff: true,
      jsonSchemaAutoRepair: true,
    },
  });
});

// -------------------------------------------------------------
// 4. CODE SENTINEL THREAT OBSERVATION & REMEDIATION APIS
// -------------------------------------------------------------
app.get('/api/security/stats', (_req, res) => {
  res.json(getSecurityStats());
});

app.get('/api/security/logs', (_req, res) => {
  const logs = getSecurityAuditLogs(100);
  res.json({ success: true, count: logs.length, logs });
});

app.get('/api/security/guidelines', (_req, res) => {
  res.json({
    success: true,
    guidelines: getStartupSecurityGuidelines(),
  });
});

app.get('/api/security/account-status', (req, res) => {
  const clientIp = req.ip || '127.0.0.1';
  const accountKey = res.locals.identity.uid;
  const status = getAccountSecurityStatus(accountKey);
  res.json({
    success: true,
    accountKey,
    status,
  });
});

app.post('/api/security/pause-account', (req, res) => {
  const { accountId, durationSeconds = 90, reason = 'Excessive activity detected by Security AI' } = req.body || {};
  const clientIp = req.ip || '127.0.0.1';
  const target = accountId || clientIp;
  const state = pauseAccount(target, Number(durationSeconds), reason);
  return res.json({
    success: true,
    action: 'PAUSED',
    accountState: state,
  });
});

app.post('/api/security/unpause-account', (req, res) => {
  const { accountId } = req.body || {};
  const clientIp = req.ip || '127.0.0.1';
  const target = accountId || clientIp;
  const state = unpauseAccount(target);
  return res.json({
    success: true,
    action: 'UNPAUSED',
    accountState: state,
  });
});

app.post('/api/security/remediate', (req, res) => {
  const { ip } = req.body;
  if (!ip) {
    return res.status(400).json({ error: 'IP parameter is required for remediation.' });
  }
  const unblocked = remediateUnquarantineIp(ip);
  return res.json({
    success: true,
    ip,
    action: unblocked ? 'UNBLOCKED' : 'NOT_FOUND_IN_QUARANTINE',
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// 5. TRANSACTION AUDIT & IDEMPOTENT STRIPE CHECKOUT APIS
// -------------------------------------------------------------
app.get('/api/stripe/config', (_req, res) => {
  const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '';
  const isConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_PRICE_ID_PRO && process.env.FIREBASE_PROJECT_ID && process.env.APP_PUBLIC_URL);
  res.json({
    publishableKey,
    isConfigured,
    tier: 'pro',
    priceId: process.env.STRIPE_PRICE_ID_PRO || 'price_indiebrotherhood_pro_499',
    monthlyPriceUsd: 4.99,
  });
});

app.get('/api/audit/transactions', async (_req, res) => {
  try { const docs = await economyDb().collection('paymentOrders').orderBy('updatedAt','desc').limit(50).get();
    const records=docs.docs.map(d=>({transactionId:d.id,idempotencyKey:d.id,status:d.data().status,stage:d.data().status,amountUsd:d.data().cents/100,needsReview:!!d.data().needsReview}));
    res.json({success:true,count:records.length,records});
  } catch { res.status(503).json({error:'Durable payment records unavailable.'}); }
});

// -------------------------------------------------------------
// 5B. REAL-WORLD ARTIST IDENTIFIER & LIVE CATALOG REGISTRY APIS
// -------------------------------------------------------------
app.get('/api/artist/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ success: true, artists: [] });
  }

  try {
    // 1. Search iTunes / Apple Music Artist Entity
    const artistUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=8`;
    const songUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;

    const [artistResp, songResp] = await Promise.allSettled([
      fetch(artistUrl, { headers: { 'User-Agent': 'indiebrotherhood/1.0' } }),
      fetch(songUrl, { headers: { 'User-Agent': 'indiebrotherhood/1.0' } }),
    ]);

    const artistMap = new Map<string, any>();

    // Process artist results
    if (artistResp.status === 'fulfilled' && artistResp.value.ok) {
      const data: any = await artistResp.value.json();
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.artistName) {
            const key = item.artistName.toLowerCase().trim();
            artistMap.set(key, {
              artistId: item.artistId,
              artistName: item.artistName,
              primaryGenreName: item.primaryGenreName || 'Independent / Contemporary',
              artistLinkUrl: item.artistLinkUrl || '',
              artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
              type: item.artistType || 'Artist',
              source: 'Global Music Registry',
              sampleTracksCount: 0,
            });
          }
        }
      }
    }

    // Process song results to enrich artwork, track counts & discover indie artists
    if (songResp.status === 'fulfilled' && songResp.value.ok) {
      const data: any = await songResp.value.json();
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.artistName) {
            const key = item.artistName.toLowerCase().trim();
            const existing = artistMap.get(key);
            const artwork = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '400x400bb') : '';
            if (existing) {
              if (!existing.artworkUrl || existing.artworkUrl.includes('unsplash')) {
                existing.artworkUrl = artwork;
              }
              existing.sampleTracksCount = (existing.sampleTracksCount || 0) + 1;
              if (item.primaryGenreName && (!existing.primaryGenreName || existing.primaryGenreName === 'Independent / Contemporary')) {
                existing.primaryGenreName = item.primaryGenreName;
              }
            } else {
              artistMap.set(key, {
                artistId: item.artistId || `indie_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                artistName: item.artistName,
                primaryGenreName: item.primaryGenreName || 'Indie / Underground',
                artistLinkUrl: item.artistViewUrl || item.trackViewUrl || '',
                artworkUrl: artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
                type: 'Indie Artist / Producer',
                source: 'Streaming Catalog Index',
                sampleTracksCount: 1,
              });
            }
          }
        }
      }
    }

    const artists = Array.from(artistMap.values());

    return res.json({
      success: true,
      query,
      count: artists.length,
      artists,
    });
  } catch (error: any) {
    console.warn('[ARTIST SEARCH ERROR]', error?.message || error);
    return res.status(503).json({error:'Artist search is unavailable. No matching artist was invented.'});
  }
});

app.get('/api/artist/catalog', async (req: Request, res: Response) => {
  const artistId = (req.query.artistId as string || '').trim();
  const artistName = (req.query.artistName as string || '').trim();

  if (!artistId && !artistName) {
    return res.status(400).json({ error: 'artistId or artistName query parameter is required.' });
  }

  try {
    let tracks: any[] = [];
    let artistData: any = {
      artistId,
      artistName: artistName || 'Indie Artist',
      primaryGenreName: 'Independent / Contemporary',
      artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    };

    // 1. Lookup by artist ID if available
    if (artistId && !artistId.startsWith('indie_')) {
      const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(artistId)}&entity=song&limit=150`;
      const lookupResp = await fetch(lookupUrl, { headers: { 'User-Agent': 'indiebrotherhood/1.0' } });
      if (lookupResp.ok) {
        const data: any = await lookupResp.json();
        if (data.results && Array.isArray(data.results)) {
          const songResults = data.results.filter((r: any) => r.wrapperType === 'track');
          const artistMeta = data.results.find((r: any) => r.wrapperType === 'artist');
          if (artistMeta) {
            artistData.artistName = artistMeta.artistName || artistData.artistName;
            artistData.primaryGenreName = artistMeta.primaryGenreName || artistData.primaryGenreName;
            artistData.artistLinkUrl = artistMeta.artistLinkUrl || '';
          }

          tracks = songResults.map((t: any) => ({
            trackId: t.trackId,
            trackName: t.trackName,
            collectionName: t.collectionName || 'Single Release',
            artistName: t.artistName,
            artistId: t.artistId,
            releaseDate: t.releaseDate ? t.releaseDate.split('T')[0] : '',
            trackTimeMillis: t.trackTimeMillis || 0,
            previewUrl: t.previewUrl || '',
            artworkUrl: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '400x400bb') : '',
            primaryGenreName: t.primaryGenreName || 'Indie',
            trackViewUrl: t.trackViewUrl || '',
            priceUsd: t.trackPrice ? `$${t.trackPrice}` : 'Stream',
            isrc: '', // Provider does not return ISRC; never invent one.
          }));
        }
      }
    }

    // 2. If tracks are empty and artistName is provided, search songs by artistName
    if (tracks.length === 0 && artistName) {
      const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=60`;
      const searchResp = await fetch(searchUrl, { headers: { 'User-Agent': 'indiebrotherhood/1.0' } });
      if (searchResp.ok) {
        const data: any = await searchResp.json();
        if (data.results && Array.isArray(data.results)) {
          // Filter to tracks matching or close to artistName
          const matched = data.results.filter((r: any) => 
            r.artistName && r.artistName.toLowerCase().includes(artistName.toLowerCase())
          );
          const listToUse = matched;

          tracks = listToUse.map((t: any) => ({
            trackId: t.trackId,
            trackName: t.trackName,
            collectionName: t.collectionName || 'Single Release',
            artistName: t.artistName,
            artistId: t.artistId,
            releaseDate: t.releaseDate ? t.releaseDate.split('T')[0] : '',
            trackTimeMillis: t.trackTimeMillis || 0,
            previewUrl: t.previewUrl || '',
            artworkUrl: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '400x400bb') : '',
            primaryGenreName: t.primaryGenreName || 'Indie',
            trackViewUrl: t.trackViewUrl || '',
            priceUsd: t.trackPrice ? `$${t.trackPrice}` : 'Stream',
            isrc: '', // Provider does not return ISRC; never invent one.
          }));
        }
      }
    }

    if (tracks[0]?.artworkUrl) {
      artistData.artworkUrl = tracks[0].artworkUrl;
    }

    return res.json({
      success: true,
      artist: artistData,
      totalTracks: tracks.length,
      tracks,
    });
  } catch (error: any) {
    return res.status(503).json({error:'Catalog lookup is unavailable. No tracks were invented.'});
  }
});

// -------------------------------------------------------------
// 6. RESILIENT HIT ANALYZER API (GEMINI 2.5 PRO -> FALLBACKS)
// -------------------------------------------------------------
app.post('/api/analyze', async (req: Request, res: Response) => {
  const { audioData, audioName, artistName, lyrics, mimeType } = req.body || {};

  let audio: ReturnType<typeof decodeAudioDataUrl>;
  try { audio = decodeAudioDataUrl(audioData); }
  catch (error) { return res.status(400).json({ error: (error as Error).message }); }

  try { for(const value of [audioName,artistName,lyrics])if(value!==undefined)textField(value,20000,false); }
  catch {return res.status(400).json({error:'Invalid track metadata.'});}

  try {

    const promptText = `
You are Hit Analyzer, an elite music intelligence system built by indiebrotherhood.
Give advisory feedback on the attached audio. Scores are subjective AI estimates, not measured streaming performance, copyright verification, or predictions of commercial success. Never invent precise loudness measurements or platform retention data.

Track Info:
- Track Title / File: "${audioName || 'Untitled Track'}"
- Artist Name: "${artistName || 'Independent Artist'}"
- Lyrics: ${lyrics ? `YES:\n"""${lyrics}"""` : 'NO'}

Output a comprehensive hit potential breakdown in JSON format.
`;

    const parts: any[] = [{ inlineData: { mimeType: audio.mimeType, data: audio.base64 } }];
    parts.push({ text: promptText });

    const schema = {
      type: Type.OBJECT,
      properties: {
        isCopyrightedOrCover: { type: Type.BOOLEAN },
        copyrightReason: { type: Type.STRING },
        hitPotentialScore: { type: Type.INTEGER },
        tierBadge: { type: Type.STRING },
        audioAnalysis: {
          type: Type.OBJECT,
          properties: {
            vocalQualityScore: { type: Type.INTEGER },
            vocalQualityReview: { type: Type.STRING },
            tuneMelodyScore: { type: Type.INTEGER },
            tuneMelodyReview: { type: Type.STRING },
            genre: { type: Type.STRING },
            vibe: { type: Type.STRING },
            tempoBpm: { type: Type.INTEGER },
            structure: { type: Type.STRING },
            mixDynamic: { type: Type.STRING },
          },
          required: [
            'vocalQualityScore', 'vocalQualityReview', 'tuneMelodyScore',
            'tuneMelodyReview', 'genre', 'vibe', 'tempoBpm', 'structure', 'mixDynamic'
          ],
        },
        lyricAnalysis: {
          type: Type.OBJECT,
          properties: {
            rhymeSchemeScore: { type: Type.INTEGER },
            narrativeImpact: { type: Type.STRING },
            phoneticFlow: { type: Type.STRING },
            hookMemorability: { type: Type.STRING },
          },
        },
        whatsWorking: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        areasToTweak: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        logicExplanation: { type: Type.STRING },
      },
      required: [
        'isCopyrightedOrCover', 'hitPotentialScore', 'tierBadge',
        'audioAnalysis', 'whatsWorking', 'areasToTweak', 'logicExplanation'
      ],
    };

    // Execute with multi-model fallback wrapper (Gemini 2.5 Pro -> Gemini 2.5 Flash -> Gemini 1.5 Pro)
    const resilientResult = await executeResilientAi({
      parts,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.2,
    });

    const result=resilientResult.data;
    if (result && typeof result.hitPotentialScore==='number' && result.hitPotentialScore>=0 && result.hitPotentialScore<=100 && result.audioAnalysis && Array.isArray(result.whatsWorking) && Array.isArray(result.areasToTweak)) {
      return res.json({
        ...resilientResult.data,
        _telemetry: {
          modelUsed: resilientResult.modelUsed,
          fallbackTriggered: resilientResult.fallbackTriggered,
          latencyMs: resilientResult.totalDurationMs,
        },
      });
    }
  } catch (error: any) {
    console.warn('[HIT ANALYZER] Provider unavailable.');
  }

  return res.status(503).json({ error: 'Audio analysis is unavailable. No score or measurement was generated.' });
});

// -------------------------------------------------------------
// 7. RESILIENT LYRIC PRO STUDIO API (ELITE GHOSTWRITER & SECURITY AI SENTINEL)
// -------------------------------------------------------------
app.post('/api/generate-lyrics', async (req: Request, res: Response) => {
  const payload = req.body || {};
  const clientIp = req.ip || '127.0.0.1';
  const accountId = res.locals.identity.uid;

  // 1. Security AI Sentinel: Bot & Excessive Request Check
  const securityCheck = recordAccountRequest({
    accountId,
    userEmail: res.locals.identity.email,
    clientIp,
    endpoint: '/api/generate-lyrics',
  });

  if (!securityCheck.allowed) {
    return res.status(429).json({
      error: securityCheck.pauseReason || 'Security AI Sentinel: Account paused due to excessive rapid requests.',
      status: 'ACCOUNT_PAUSED',
      pausedUntil: securityCheck.pausedUntil,
      remainingSeconds: securityCheck.remainingSeconds,
      pauseReason: securityCheck.pauseReason,
      trustScore: securityCheck.trustScore,
      incidentId: `sec_pause_${Date.now()}`,
    });
  }

  try {
    const genre = payload.customGenre && payload.customGenre.trim() ? payload.customGenre.trim() : payload.genre || 'Hip-Hop';
    const vibe = payload.customVibe && payload.customVibe.trim() ? payload.customVibe.trim() : payload.vibe || 'Aggressive';
    const explicit = !!payload.explicit;
    const mode = payload.mode || 'full_song';
    const structure = payload.structure || 'Verse-Chorus-Verse-Chorus-Bridge-Outro';
    const userLyrics = payload.userLyrics ? payload.userLyrics.trim() : '';
    const userLyricsOption = payload.userLyricsOption || 'finish_lyrics';

    const systemInstruction = `You are Lyric Pro, an elite, multi-platinum ghostwriter and master lyricist. You craft chart-topping, deeply memorable, and structurally flawless song lyrics across rap, rock, pop, metal, and hybrid genres.

CORE WRITING RULES & MECHANICS:
1. CADENCE & PROSODY: Maintain strict, intentional syllable counts and natural vocal rhythm for each section. Lyrics must flow effortlessly when spoken or sung to a beat.
2. ADVANCED RHYME SCHEMES: Prioritize slant rhymes, internal rhymes, multi-syllabic rhymes, and assonance/consonance over simple AABB end-rhymes. 
3. BANNED CLICHÉS: Never use tired, amateur pairings (e.g., fire/desire, heart/apart, light/night, rain/pain, pain/gain). 
4. VISCERAL IMAGERY: Use concrete "show, don't tell" sensory details (textures, sounds, specific scenes) rather than generic abstract emotions.
5. METRICAL DYNAMICS: Every section must serve a purpose—Verses build narrative depth, Pre-Choruses build tension, Choruses provide the explosive, repetitive hook, Bridges deliver an emotional pivot, and Outros fade or resolve.

BEHAVIORAL CONSTRAINTS:
- Do NOT output conversational greetings, setup prose, or markdown text outside the JSON.
- Never give a response other than lyrics.
- Generate complete, fully-fleshed songs with zero placeholder text or repeated empty lines.`;

    const prompt = `Write a multi-platinum, structurally flawless studio song blueprint for:
- Genre / Style: ${genre}
- Mood & Vibe: ${vibe}
- Explicit Content: ${explicit ? 'YES (Raw, Unfiltered, Explicit allowed)' : 'NO (100% Clean, Radio-Friendly)'}
- Mode: ${mode}
- Song Structure: ${structure}
${userLyrics ? `- User-provided Lyrics/Concept (${userLyricsOption}): "${userLyrics}"` : ''}

Generate TWO COMPREHENSIVE TAKES:
1. Primary Master Blueprint (Lead vocal take with deep narrative & explosive hook)
2. Alternate Flow Take (Distinct cadence variation, alternate rhyme schemes, and high-contrast rhythm motif)

Return strictly valid JSON matching the schema.`;

    const lineSchema = {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        syllables: { type: Type.INTEGER },
        rhyme_markers: { type: Type.STRING },
      },
      required: ['text', 'syllables', 'rhyme_markers'],
    };

    const sectionSchema = {
      type: Type.OBJECT,
      properties: {
        section_name: { type: Type.STRING },
        rhyme_scheme: { type: Type.STRING },
        energy_level: { type: Type.INTEGER },
        lines: {
          type: Type.ARRAY,
          items: lineSchema,
        },
      },
      required: ['section_name', 'rhyme_scheme', 'energy_level', 'lines'],
    };

    const schema = {
      type: Type.OBJECT,
      properties: {
        song_metadata: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            genre_style: { type: Type.STRING },
            target_bpm: { type: Type.INTEGER },
            vocal_delivery_notes: { type: Type.STRING },
          },
          required: ['title', 'genre_style', 'target_bpm', 'vocal_delivery_notes'],
        },
        lyrics: {
          type: Type.ARRAY,
          items: sectionSchema,
        },
        hook_breakdown: {
          type: Type.OBJECT,
          properties: {
            core_earworm: { type: Type.STRING },
            rhythmic_motif: { type: Type.STRING },
          },
          required: ['core_earworm', 'rhythmic_motif'],
        },
        alternate_take: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            genre_style: { type: Type.STRING },
            target_bpm: { type: Type.INTEGER },
            vocal_delivery_notes: { type: Type.STRING },
            lyrics: {
              type: Type.ARRAY,
              items: sectionSchema,
            },
            hook_breakdown: {
              type: Type.OBJECT,
              properties: {
                core_earworm: { type: Type.STRING },
                rhythmic_motif: { type: Type.STRING },
              },
              required: ['core_earworm', 'rhythmic_motif'],
            },
          },
          required: ['title', 'lyrics', 'hook_breakdown'],
        },
      },
      required: ['song_metadata', 'lyrics', 'hook_breakdown'],
    };

    const result = await executeResilientAi({
      prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.75,
    });

    if (result.data) {
      const mainData = result.data;
      const altData = mainData.alternate_take || {};

      // Convert sections array into formatted string content
      const formatSectionLines = (sections: any[]) => {
        if (!Array.isArray(sections)) return '';
        return sections
          .map((sec) => {
            const header = `[${(sec.section_name || 'SECTION').toUpperCase()}]`;
            const lines = (sec.lines || []).map((l: any) => l.text || '').join('\n');
            return `${header}\n${lines}`;
          })
          .join('\n\n');
      };

      const contentA = formatSectionLines(mainData.lyrics);
      const contentB = altData.lyrics ? formatSectionLines(altData.lyrics) : contentA;

      const setA = {
        title: mainData.song_metadata?.title || 'Master Song Blueprint',
        genre: mainData.song_metadata?.genre_style || genre,
        vibe,
        structure,
        explicit,
        content: contentA,
        summaryNote: `${mainData.song_metadata?.vocal_delivery_notes || ''} | Target BPM: ${mainData.song_metadata?.target_bpm || 120}`,
        song_metadata: mainData.song_metadata,
        lyrics: mainData.lyrics,
        hook_breakdown: mainData.hook_breakdown,
      };

      const setB = {
        title: altData.title || `${setA.title} (Alternate Cadence Mix)`,
        genre: altData.genre_style || genre,
        vibe,
        structure,
        explicit,
        content: contentB,
        summaryNote: `${altData.vocal_delivery_notes || 'Alternative syncopated rhythm and modified vocal accents.'} | Target BPM: ${altData.target_bpm || mainData.song_metadata?.target_bpm || 120}`,
        song_metadata: {
          title: altData.title || `${setA.title} (Alternate Flow)`,
          genre_style: altData.genre_style || genre,
          target_bpm: altData.target_bpm || mainData.song_metadata?.target_bpm || 120,
          vocal_delivery_notes: altData.vocal_delivery_notes || 'Syncopated staccato flow variation.',
        },
        lyrics: altData.lyrics || mainData.lyrics,
        hook_breakdown: altData.hook_breakdown || mainData.hook_breakdown,
      };

      return res.json({
        setA,
        setB,
        rawBlueprint: mainData,
        isAiGenerated: true,
        timestamp: Date.now(),
        _telemetry: {
          modelUsed: result.modelUsed,
          fallbackTriggered: result.fallbackTriggered,
          latencyMs: result.totalDurationMs,
          securityStatus: 'ACTIVE',
          trustScore: securityCheck.trustScore,
        },
      });
    }
  } catch (err) {
    console.error('[LYRIC PRO AI ERROR, APPLYING ALGORITHMIC FALLBACK]', err);
  }

  // Resilient fallback to algorithmic templates
  const algoResult = generateAlgorithmicLyrics(payload);
  return res.json({...algoResult,source:'template',notice:'Template-generated lyrics; the AI provider was unavailable.'});
});

// -------------------------------------------------------------
// 8. RESILIENT SONIC IQ LAB / QUIZ STUDIO API
// -------------------------------------------------------------
app.post('/api/quiz/generate', async (req: Request, res: Response) => {
  try {
    const { topic = 'Hip Hop History', quizType = 'music_trivia', difficulty = 'Medium', numberOfQuestions = 5 } = req.body;

    const prompt = `Generate a ${difficulty} level music quiz about "${topic}".
Quiz Type: ${quizType === 'finish_the_song' ? 'Finish the Song Lyrics' : quizType === 'whats_the_artist' ? "Guess What's the Artist" : 'Genre Music Trivia'}.
Create ${numberOfQuestions} multiple-choice questions with exactly 4 options and correctIndex.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              questionText: { type: Type.STRING },
              songContext: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ['id', 'questionText', 'options', 'correctIndex', 'explanation']
          }
        }
      },
      required: ['title', 'description', 'questions']
    };

    const result = await executeResilientAi({
      prompt,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.3,
    });

    return res.json({
      success: true,
      quiz: result.data,
      _telemetry: {
        modelUsed: result.modelUsed,
        fallbackTriggered: result.fallbackTriggered,
        latencyMs: result.totalDurationMs,
      },
    });
  } catch (error: any) { return res.status(503).json({ error: 'The AI provider is unavailable. No generated result was returned.' }); }
});

// -------------------------------------------------------------
// 9. RESILIENT HANG OUT GEMINI APIS
// -------------------------------------------------------------
app.post('/api/gemini/battle-judge', async (req: Request, res: Response) => {
  try {
    const { player1Name, player2Name, player1Verses, player2Verses, tier } = req.body;

    const prompt = `You are the Master Rap Battle Judge for "Hang Out by indiebrotherhood".
Evaluate this rap battle in "${tier || 'Fluent'}" tier between ${player1Name} and ${player2Name}.
${player1Name}'s Verses: ${player1Verses?.join('\n---\n')}
${player2Name}'s Verses: ${player2Verses?.join('\n---\n')}
Provide an authentic verdict in JSON.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        p1RhymeFlow: { type: Type.NUMBER },
        p1Punchlines: { type: Type.NUMBER },
        p1Wordplay: { type: Type.NUMBER },
        p2RhymeFlow: { type: Type.NUMBER },
        p2Punchlines: { type: Type.NUMBER },
        p2Wordplay: { type: Type.NUMBER },
        winnerName: { type: Type.STRING },
        judgeFeedback: { type: Type.STRING }
      },
      required: ['p1RhymeFlow', 'p2RhymeFlow', 'winnerName', 'judgeFeedback']
    };

    const result = await executeResilientAi({
      prompt,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.4,
    });

    return res.json({
      success: true,
      evaluation: result.data,
      _telemetry: {
        modelUsed: result.modelUsed,
        fallbackTriggered: result.fallbackTriggered,
      },
    });
  } catch (error: any) { return res.status(503).json({ error: 'The AI provider is unavailable. No generated result was returned.' }); }
});

app.post('/api/gemini/ai-bot-rap', async (req: Request, res: Response) => {
  try {
    const { botName, tier, opponentVerse } = req.body;
    const prompt = `You are ${botName || 'MC Spitfire'}, dropping battle bars in "${tier || 'Fluent'}" tier for indiebrotherhood. Counter verse: "${opponentVerse || 'Ready'}". Return 4-8 fiery bars.`;

    const result = await executeResilientAi({
      prompt,
      temperature: 0.8,
    });

    return res.json({
      success: true,
      verse: result.rawText.trim(),
      _telemetry: { modelUsed: result.modelUsed },
    });
  } catch (error: any) { return res.status(503).json({ error: 'The AI provider is unavailable. No generated result was returned.' }); }
});

// -------------------------------------------------------------
// 9B. RESILIENT ARTIST ASSISTANT & MUSIC CAREER ADVISOR API
// -------------------------------------------------------------
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], artistProfile = {}, songCatalog = [], enableSearch } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const artistName = artistProfile.artistName || 'Independent Creator';
    const genre = artistProfile.genre || 'Independent / Contemporary';
    const pro = artistProfile.pro || 'ASCAP / BMI';
    const publisher = artistProfile.publisher || 'Self-Published';
    const catalogCount = Array.isArray(songCatalog) ? songCatalog.length : 0;

    const catalogSummary = Array.isArray(songCatalog) && songCatalog.length > 0
      ? songCatalog.slice(0, 10).map((s: any) => `- "${s.title || s.trackName}" (${s.genre || s.primaryGenreName || 'Indie'}, ISRC: ${s.isrc || 'Pending'}, Splits: ${s.splits ? JSON.stringify(s.splits) : '100% Artist'})`).join('\n')
      : 'No registered catalog tracks yet.';

    const systemInstruction = `You are the Gemini Music Career Assistant & Legal Advisor, built exclusively for indiebrotherhood.
You serve as an elite artist manager, sync licensing director, entertainment attorney, and streaming strategist.

CURRENT ARTIST DOSSIER:
- Artist Name: ${artistName}
- Primary Genre: ${genre}
- PRO Affiliation: ${pro}
- Publishing Entity: ${publisher}
- Active Catalog Size: ${catalogCount} tracks
- Catalog Excerpt:
${catalogSummary}

GUIDELINES:
1. Provide actionable, high-level music industry advice (split sheets, copyright, The MLC mechanical royalties, SoundExchange, Spotify editorial pitching, sync licensing, DSP distribution, and release strategy).
2. Format answers with clear Markdown headings, bullet points, and high-impact emphasis.
3. Be direct, authoritative, and artist-first. Protect the creator's masters, publishing, and royalties at all times.`;

    const conversationParts: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        const text = item.parts?.[0]?.text || item.content || '';
        if (text) {
          conversationParts.push({ text: `[${item.role === 'model' ? 'ASSISTANT' : 'ARTIST'}]: ${text}` });
        }
      }
    }
    conversationParts.push({ text: `[ARTIST QUESTION]: ${message}` });

    const result = await executeResilientAi({
      parts: conversationParts,
      systemInstruction,
      temperature: 0.6,
    });

    return res.json({
      success: true,
      reply: result.rawText.trim(),
      _telemetry: {
        modelUsed: result.modelUsed,
        fallbackTriggered: result.fallbackTriggered,
        latencyMs: result.totalDurationMs,
      },
    });
  } catch (error: any) { return res.status(503).json({ error: 'The AI provider is unavailable. No generated result was returned.' }); }
});

// -------------------------------------------------------------
// 10. WEBSOCKET MULTIPLEXER (HANG OUT & MEETING ROOM)
// -------------------------------------------------------------
const realtime = attachRealtime(httpServer);
const stopPaymentMonitor=startPaymentMonitor(getStripeClient);
httpServer.on('close',stopPaymentMonitor);

// -------------------------------------------------------------
// 10B. MASTER ADMIN BROADCAST & ROSTER CONTROL APIS
// -------------------------------------------------------------
app.post('/api/admin/broadcast', (req, res) => {
  try { realtime.broadcast({type:'ADMIN_BROADCAST',title:textField(req.body?.title,200),message:textField(req.body?.message,4000),priority:'high',senderName:String(res.locals.identity.name||'Administrator')});res.json({success:true}); }
  catch {res.status(400).json({error:'Provide a title and message.'});}
});
app.post(['/api/admin/kick', '/api/admin/blacklist'], (_req, res) => {
  res.status(503).json({ error: 'Server moderation is unavailable during the security upgrade. No user was removed.' });
});

// -------------------------------------------------------------
// 11. VITE & STATIC ASSET SERVING
// -------------------------------------------------------------
app.use('/api', (_req, res) => { res.status(404).json({ error: 'API endpoint not found.' }); });
app.get(['/server.cjs', '/server.cjs.map'], (_req, res) => { res.sendStatus(404); });

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist/client');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    const address = httpServer.address();
    console.log(`indiebrotherhood unified suite running on http://0.0.0.0:${typeof address === 'object' ? address?.port : PORT}`);
  });
}

startServer();
