import { GoogleGenAI } from '@google/genai';
import { ParsedTrack, Folder, MediaFile, AssistantMessage, AppSettings } from '../types';

/**
 * Music Industry & Royalty AI Assistant Service
 * Context-aware AI strategist that knows the artist's catalog, analyzes royalty earnings,
 * validates PRO splits, and guides them through any music metadata confusion.
 */

export interface CatalogContext {
  totalTracks: number;
  unverifiedCount: number;
  totalStreams: number;
  totalRevenue: number;
  currency: string;
  topArtists: string[];
  topTracks: { title: string; isrc: string; streams?: number; revenue?: number }[];
  missingIsrcCount: number;
  missingIswcCount: number;
  foldersCount: number;
  filesCount: number;
}

export function buildCatalogContext(
  tracks: ParsedTrack[],
  folders: Folder[],
  files: MediaFile[],
  currency: string
): CatalogContext {
  const unverified = tracks.filter(t => !t.validated);
  const missingIsrc = tracks.filter(t => !t.isrc);
  const missingIswc = tracks.filter(t => !t.iswc);
  const totalStreams = tracks.reduce((sum, t) => sum + (t.streams || 0), 0);
  const totalRevenue = tracks
    .filter(t => t.currency === currency)
    .reduce((sum, t) => sum + (t.revenue || 0), 0);

  const artistsSet = new Set<string>();
  tracks.forEach(t => {
    if (t.artist && t.artist !== 'Primary Artist') artistsSet.add(t.artist);
  });

  const sortedTracks = [...tracks].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
  const topTracks = sortedTracks.slice(0, 5).map(t => ({
    title: t.title,
    isrc: t.isrc || 'Missing ISRC',
    streams: t.streams,
    revenue: t.revenue,
  }));

  return {
    totalTracks: tracks.length,
    unverifiedCount: unverified.length,
    totalStreams,
    totalRevenue,
    currency,
    topArtists: Array.from(artistsSet),
    topTracks,
    missingIsrcCount: missingIsrc.length,
    missingIswcCount: missingIswc.length,
    foldersCount: folders.length,
    filesCount: files.length,
  };
}

/**
 * Built-in Rule-Based Fallback Advisor (Offline / Zero-Key Mode)
 */
function getOfflineAssistantResponse(query: string, context: CatalogContext): { text: string; action?: AssistantMessage['suggestedAction'] } {
  const q = query.toLowerCase();

  if (q.includes('audit') || q.includes('health') || q.includes('check') || q.includes('analyze')) {
    let text = `### 📊 Catalog Royalty & Metadata Audit\n\n`;
    text += `I analyzed your **${context.totalTracks} loaded tracks**:\n\n`;
    text += `- **Total Streams Tracked**: ${context.totalStreams.toLocaleString()}\n`;
    text += `- **Recorded Earnings**: ${context.currency === 'USD' ? '$' : context.currency} ${context.totalRevenue.toFixed(2)}\n`;
    text += `- **Needs Review / Unverified**: ${context.unverifiedCount} tracks\n`;
    text += `- **Missing ISRCs**: ${context.missingIsrcCount} tracks\n`;
    text += `- **Missing ISWCs (Songwriting)**: ${context.missingIswcCount} tracks\n\n`;

    if (context.unverifiedCount > 0) {
      text += `> ⚠️ **Action Item**: You have **${context.unverifiedCount} unverified tracks**. Use the online **MusicBrainz / Deezer** lookup or review them before exporting to ASCAP or The MLC.`;
      return {
        text,
        action: { type: 'view_unverified', label: 'View Unverified Tracks' },
      };
    } else {
      text += `> ✅ **All tracks verified!** Your catalog is in great shape to export for ASCAP, BMI, The MLC, or SoundExchange.`;
      return {
        text,
        action: { type: 'open_export', label: 'Open PRO Export Engine' },
      };
    }
  }

  if (q.includes('isrc') && q.includes('iswc')) {
    return {
      text: `### 🔑 ISRC vs. ISWC: What's the Difference?\n\n` +
        `1. **ISRC (International Standard Recording Code)**:\n` +
        `   - Identifies the **Sound Recording (Master Audio Track)**.\n` +
        `   - Issued by your distributor (DistroKid, TuneCore, etc.) or your label.\n` +
        `   - Required for Spotify, Apple Music, and **SoundExchange** (digital performance royalties for recording artist & label).\n\n` +
        `2. **ISWC (International Standard Musical Work Code)**:\n` +
        `   - Identifies the **Composition / Songwriting / Lyrics & Melody**.\n` +
        `   - Issued by your PRO (ASCAP, BMI, SESAC, PRS) or **The MLC**.\n` +
        `   - Used to pay songwriter and publisher mechanical & performance royalties.`,
    };
  }

  if (q.includes('mlc') || q.includes('mechanical')) {
    return {
      text: `### 🏛️ Collecting Mechanical Royalties with The MLC\n\n` +
        `The **Mechanical Licensing Collective (The MLC)** collects digital audio mechanical royalties generated when your songs are streamed on interactive DSPs like Spotify, Apple Music, and Amazon.\n\n` +
        `**How to claim:**\n` +
        `1. Export your tracks using the **The MLC (Mechanical Licensing Collective)** CSV preset in the Export modal.\n` +
        `2. Log in to [TheMLC.com](https://www.themlc.com/) portal.\n` +
        `3. Go to Works Registration -> Bulk Upload -> Upload your generated CSV.\n` +
        `4. Ensure you claim your 100% mechanical share (or split share if co-written).`,
      action: { type: 'open_export', label: 'Export The MLC CSV' },
    };
  }

  if (q.includes('soundexchange') || q.includes('digital performance')) {
    return {
      text: `### 📻 SoundExchange: Digital Performance Royalties\n\n` +
        `SoundExchange collects royalties for **non-interactive digital transmissions** (Pandora Radio, SiriusXM, web radio, cable TV music channels).\n\n` +
        `- **Who gets paid?** 50% Sound Recording Copyright Owner (Label/Master holder), 45% Featured Artist, 5% Non-featured musicians fund.\n` +
        `- **In RoyaltyOps**: Click Export -> Choose **SoundExchange ISRC Ingestion** to generate your sound recording catalog submission!`,
      action: { type: 'open_export', label: 'Export SoundExchange File' },
    };
  }

  if (q.includes('byok') || q.includes('api key') || q.includes('spotify key') || q.includes('integrate')) {
    return {
      text: `### 🔑 Bring Your Own Key (BYOK) Integrations\n\n` +
        `You can connect your own developer keys in the **BYOK Hub**:\n\n` +
        `- **Google Gemini 2.5 Flash**: Free 1,500 req/day for AI statement OCR parsing.\n` +
        `- **Spotify Web API**: Live Spotify popularity, audio analysis, and playlist tracking.\n` +
        `- **Deezer & MusicBrainz**: Already integrated 100% free with no keys needed!\n` +
        `- **Discogs API**: Physical vinyl/CD release cataloging.\n` +
        `- **AcoustID**: Audio fingerprint matching.\n\n` +
        `Click below to configure your keys in Settings.`,
      action: { type: 'open_settings', label: 'Configure BYOK Keys' },
    };
  }

  // Default response with personalized context
  let defaultText = `Hey! I'm your **IndieBrotherhood Music & Royalty Assistant**.\n\n`;
  defaultText += `I have your active catalog loaded: **${context.totalTracks} tracks** across **${context.foldersCount} folders**, with **${context.unverifiedCount} items needing verification**.\n\n`;
  defaultText += `Ask me anything about:\n`;
  defaultText += `- 🔍 *Auditing your catalog for missing ISRCs & splits*\n`;
  defaultText += `- 💰 *How mechanical (MLC) vs. performance (ASCAP/BMI) vs. master (SoundExchange) royalties work*\n`;
  defaultText += `- 📁 *Organizing statements and folder structures*\n`;
  defaultText += `- 🔑 *Connecting Spotify, Gemini, and BYOK developer keys*`;

  return {
    text: defaultText,
    action: context.unverifiedCount > 0 ? { type: 'view_unverified', label: 'Review Unverified Tracks' } : undefined,
  };
}

/**
 * Ask the AI Assistant (Gemini 2.5 Flash if API Key available, or Offline Advisor)
 */
export async function askAssistant(
  userQuery: string,
  history: AssistantMessage[],
  catalogContext: CatalogContext,
  settings: AppSettings
): Promise<AssistantMessage> {
  const apiKey = settings.geminiApiKey?.trim();

  if (!apiKey) {
    const offlineResult = getOfflineAssistantResponse(userQuery, catalogContext);
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'assistant',
      text: offlineResult.text,
      timestamp: Date.now(),
      suggestedAction: offlineResult.action,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are the master Music Industry Strategist, Royalty Auditor, and Artist Assistant built by indiebrotherhood for independent musicians, songwriters, and label owners.
You are embedded directly inside the RoyaltyOps application.

Current User Catalog State:
- Total Tracks Loaded: ${catalogContext.totalTracks}
- Unverified / Needs Review Tracks: ${catalogContext.unverifiedCount}
- Missing ISRCs: ${catalogContext.missingIsrcCount}
- Missing ISWCs: ${catalogContext.missingIswcCount}
- Total Streams Tracked: ${catalogContext.totalStreams.toLocaleString()}
- Total Gross Revenue: ${catalogContext.currency} ${catalogContext.totalRevenue.toFixed(2)}
- Identified Artists: ${catalogContext.topArtists.join(', ') || 'Independent Artist'}
- Top Earning Tracks: ${JSON.stringify(catalogContext.topTracks)}

Guidelines:
1. Speak in an empowering, highly knowledgeable, and friendly tone suitable for independent music creators.
2. Directly answer their question regarding music publishing, royalties (ASCAP, BMI, SESAC, The MLC, SoundExchange, DistroKid, TuneCore), split sheets, ISRC codes, or file organization.
3. Be concise and use structured markdown with bullet points and bolding.
4. Reference their actual catalog numbers when relevant so they know you understand their current project.
`;

    const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userQuery }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    const responseText = response.text || 'I analyzed your request. How else can I assist with your royalties?';

    // Determine if an action button is appropriate
    let suggestedAction: AssistantMessage['suggestedAction'] | undefined;
    const lower = responseText.toLowerCase();
    if (lower.includes('unverified') && catalogContext.unverifiedCount > 0) {
      suggestedAction = { type: 'view_unverified', label: 'View Unverified Tracks' };
    } else if (lower.includes('export') || lower.includes('csv') || lower.includes('mlc')) {
      suggestedAction = { type: 'open_export', label: 'Open Export Engine' };
    } else if (lower.includes('api key') || lower.includes('settings')) {
      suggestedAction = { type: 'open_settings', label: 'Open Settings' };
    }

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'assistant',
      text: responseText,
      timestamp: Date.now(),
      suggestedAction,
    };
  } catch (err: any) {
    console.warn('Gemini Assistant call failed, using offline fallback:', err);
    const offlineResult = getOfflineAssistantResponse(userQuery, catalogContext);
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'assistant',
      text: offlineResult.text,
      timestamp: Date.now(),
      suggestedAction: offlineResult.action,
    };
  }
}
