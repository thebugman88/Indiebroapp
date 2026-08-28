import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  ExternalLink,
  Smartphone,
  Edit3,
  Music,
  Globe,
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Code
} from 'lucide-react';
import { SmartLinkData, SmartLinkPlatform } from '../types';
import { escapeHtml, safeExternalUrl } from '../utils/html';

interface SmartLinkGeneratorProps {
  isAutoSaveOn: boolean;
  lastSaved: Date | null;
}

const DEFAULT_PLATFORMS: SmartLinkPlatform[] = [
  { id: 'spotify', name: 'Spotify', icon: 'spotify', url: '', enabled: true, actionText: 'Play' },
  { id: 'apple', name: 'Apple Music', icon: 'apple', url: '', enabled: true, actionText: 'Listen' },
  { id: 'youtube', name: 'YouTube Music', icon: 'youtube', url: '', enabled: true, actionText: 'Watch' },
  { id: 'soundcloud', name: 'SoundCloud', icon: 'soundcloud', url: '', enabled: true, actionText: 'Stream' },
  { id: 'bandcamp', name: 'Bandcamp', icon: 'bandcamp', url: '', enabled: true, actionText: 'Buy' },
  { id: 'tidal', name: 'TIDAL', icon: 'tidal', url: '', enabled: true, actionText: 'Play' },
  { id: 'tiktok', name: 'TikTok Sound', icon: 'tiktok', url: '', enabled: true, actionText: 'Use Audio' },
];

const INITIAL_SMART_LINK: SmartLinkData = {
  artistName: '',
  releaseTitle: '',
  releaseType: 'Single',
  releaseDate: '',
  coverArtUrl: '',
  bio: '',
  socialHandles: {
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    spotify: '',
  },
  platforms: DEFAULT_PLATFORMS,
  customMessage: '',
};

export const SmartLinkGenerator: React.FC<SmartLinkGeneratorProps> = ({ isAutoSaveOn }) => {
  const [data, setData] = useState<SmartLinkData>(() => {
    try {
      const saved = localStorage.getItem('indie_smart_link_data');
      return saved ? JSON.parse(saved) : INITIAL_SMART_LINK;
    } catch {
      return INITIAL_SMART_LINK;
    }
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [copiedType, setCopiedType] = useState<'url' | 'html' | 'json' | null>(null);

  const updateField = (field: keyof SmartLinkData, value: any) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      if (isAutoSaveOn) {
        try {
          localStorage.setItem('indie_smart_link_data', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  const updatePlatform = (id: string, field: keyof SmartLinkPlatform, value: any) => {
    const updated = data.platforms.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    updateField('platforms', updated);
  };

  // Generate Standalone HTML Micro-Page
  const generateStandaloneHtml = () => {
    const activePlatforms = data.platforms.filter((p) => p.enabled);
    const artistName = escapeHtml(data.artistName);
    const releaseTitle = escapeHtml(data.releaseTitle);
    const releaseType = escapeHtml(data.releaseType);
    const customMessage = escapeHtml(data.customMessage);
    const coverArtUrl = escapeHtml(safeExternalUrl(data.coverArtUrl));
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artistName} - ${releaseTitle}</title>
  <meta name="description" content="${customMessage}">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #09090b; color: #f4f4f5; display: flex; justify-content: center; min-height: 100vh; padding: 20px; }
    .container { max-width: 420px; width: 100%; text-align: center; margin: auto; padding: 24px; background: #18181b; border-radius: 24px; border: 1px solid #27272a; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .cover { width: 220px; height: 220px; object-fit: cover; border-radius: 16px; margin: 0 auto 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
    .artist { font-size: 14px; color: #a1a1aa; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; background: #27272a; color: #e4e4e7; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
    .platforms { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .link-card { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #09090b; border: 1px solid #27272a; border-radius: 12px; text-decoration: none; color: #f4f4f5; transition: all 0.15s; }
    .link-card:hover { border-color: #f43f5e; transform: translateY(-1px); }
    .btn { background: #f43f5e; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .footer { font-size: 11px; color: #71717a; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <img src="${coverArtUrl === '#' ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop' : coverArtUrl}" alt="${releaseTitle}" class="cover">
    <h1 class="title">${releaseTitle}</h1>
    <h2 class="artist">${artistName}</h2>
    <span class="badge">${releaseType} • Out Now</span>
    
    <div class="platforms">
      ${activePlatforms.map((p) => `
        <a href="${escapeHtml(safeExternalUrl(p.url))}" target="_blank" rel="noopener noreferrer" class="link-card">
          <span style="font-weight: 600;">${escapeHtml(p.name)}</span>
          <span class="btn">${escapeHtml(p.actionText)}</span>
        </a>
      `).join('')}
    </div>
    
    <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5; margin-bottom: 12px;">${customMessage}</p>
    <div class="footer">quick tools by indiebrotherhood</div>
  </div>
</body>
</html>`;
  };

  const handleCopy = (type: 'url' | 'html' | 'json') => {
    let content = '';
    if (type === 'url') {
      content = `https://smartlink.indiebrotherhood.com/${data.artistName.toLowerCase().replace(/\s+/g, '-')}/${data.releaseTitle.toLowerCase().replace(/\s+/g, '-')}`;
    } else if (type === 'html') {
      content = generateStandaloneHtml();
    } else {
      content = JSON.stringify(data, null, 2);
    }

    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handleDownloadHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartlink_${data.releaseTitle.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }; return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Top Header Card */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 text-xs font-mono text-white/40">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>epk & smart link promo page generator</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('url')}
              className="px-2.5 py-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-white/70 hover:text-white border border-white/5 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider"
            >
              {copiedType === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Globe className="w-3.5 h-3.5" />}
              <span>{copiedType === 'url' ? 'copied url!' : 'copy link'}</span>
            </button>

            <button
              onClick={() => handleCopy('html')}
              className="px-2.5 py-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-white/70 hover:text-white border border-white/5 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider"
            >
              {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5" />}
              <span>{copiedType === 'html' ? 'copied html!' : 'copy html'}</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm text-xs font-bold uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5" />
              <span>download html page</span>
            </button>
          </div>
        </div>

        {/* View Toggle on smaller screens */}
        <div className="flex sm:hidden bg-[#050505] p-1 rounded-xl border border-white/5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold ${activeTab === 'editor' ? 'bg-white/10 text-white' : 'text-white/40'}`}
          >
            editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold ${activeTab === 'preview' ? 'bg-white/10 text-white' : 'text-white/40'}`}
          >
            live preview
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Phone Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Link Configuration Editor */}
        <div className={`lg:col-span-7 space-y-5 ${activeTab === 'preview' ? 'hidden sm:block' : 'block'}`}>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl font-mono text-xs">
            <span className="text-white font-bold block border-b border-white/5 pb-3 uppercase tracking-wider text-[11px]">
              1. release & artist profile details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-white/40">artist / band name *</label>
                <input
                  id="smartlink-artist-name"
                  type="text"
                  value={data.artistName}
                  onChange={(e) => updateField('artistName', e.target.value)}
                  placeholder="e.g. Neon Horizon"
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/40">release title *</label>
                <input
                  id="smartlink-release-title"
                  type="text"
                  value={data.releaseTitle}
                  onChange={(e) => updateField('releaseTitle', e.target.value)}
                  placeholder="e.g. Midnight Drive"
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/40">release type</label>
                <select
                  value={data.releaseType}
                  onChange={(e) => updateField('releaseType', e.target.value as any)}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Single">Single</option>
                  <option value="EP">EP</option>
                  <option value="Album">Album</option>
                  <option value="Beat">Beat / Instrumental</option>
                  <option value="Mixtape">Mixtape</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white/40">release date</label>
                <input
                  type="date"
                  value={data.releaseDate}
                  onChange={(e) => updateField('releaseDate', e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-white/40 flex items-center justify-between">
                  <span>cover artwork image url</span>
                  <span className="text-[10px] text-white/30">1:1 square recommended</span>
                </label>
                <input
                  id="smartlink-cover-url"
                  type="text"
                  value={data.coverArtUrl}
                  onChange={(e) => updateField('coverArtUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-white/40">custom promo message / call-to-action</label>
                <input
                  type="text"
                  value={data.customMessage}
                  onChange={(e) => updateField('customMessage', e.target.value)}
                  placeholder="Stream the new single now across all major platforms."
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-white/40">artist bio (for epk mode)</label>
                <textarea
                  value={data.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={2}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Platform Streaming Links Config */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl font-mono text-xs">
            <span className="text-white font-bold block border-b border-white/5 pb-3 uppercase tracking-wider text-[11px]">
              2. platform streaming & store links
            </span>

            <div className="space-y-2.5">
              {data.platforms.map((p) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${p.enabled ? 'bg-[#050505] border-white/5' : 'bg-[#050505]/40 border-white/5 opacity-50'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 sm:w-36">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => updatePlatform(p.id, 'enabled', e.target.checked)}
                      className="accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-white truncate">{p.name}</span>
                  </div>

                  <input
                    type="text"
                    value={p.url}
                    onChange={(e) => updatePlatform(p.id, 'url', e.target.value)}
                    placeholder={`https://${p.id}.com/...`}
                    className="flex-1 bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500/50 text-xs"
                  />

                  <input
                    type="text"
                    value={p.actionText}
                    onChange={(e) => updatePlatform(p.id, 'actionText', e.target.value)}
                    placeholder="Play"
                    className="w-20 bg-[#111] border border-white/10 rounded-lg px-2 py-1.5 text-white text-center font-bold uppercase text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Live Interactive Smart Link Micro-Page Preview */}
        <div className={`lg:col-span-5 ${activeTab === 'editor' ? 'hidden sm:block' : 'block'}`}>
          <div className="sticky top-20 bg-[#111] border border-white/5 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full text-xs font-mono text-white/40 border-b border-white/5 pb-3">
              <span className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>live micro-page preview</span>
              </span>
              <span className="text-[10px] text-white/30">mobile viewport</span>
            </div>

            {/* Smartphone Mockup Container */}
            <div className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-2xl p-5 space-y-4 text-center shadow-inner relative overflow-hidden">
              {/* Artwork Cover */}
              <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#111] flex flex-col items-center justify-center">
                {data.coverArtUrl ? (
                  <img
                    src={data.coverArtUrl}
                    alt={data.releaseTitle || 'Cover'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-white/20 p-4">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">Artwork Preview</span>
                  </div>
                )}
              </div>

              {/* Title & Artist */}
              <div>
                <h3 className="text-lg font-bold font-mono text-white tracking-tight">
                  {data.releaseTitle || 'Untitled Release'}
                </h3>
                <p className="text-xs font-sans text-white/50 mt-0.5">
                  {data.artistName || 'Artist Name'}
                </p>
                <span className="inline-block px-2.5 py-0.5 mt-2 rounded-full bg-[#111] border border-white/10 text-[10px] font-mono text-white/60 uppercase tracking-wider">
                  {data.releaseType || 'Release'} • {data.releaseDate ? data.releaseDate : 'Coming Soon'}
                </span>
              </div>

              {/* Custom Message */}
              {data.customMessage && (
                <p className="text-[11px] font-sans text-white/60 line-clamp-2 px-2">
                  {data.customMessage}
                </p>
              )}

              {/* Streaming Platform Action Buttons */}
              <div className="space-y-2 pt-2 text-left">
                {data.platforms.filter((p) => p.enabled).map((p) => (
                  <a
                    key={p.id}
                    href={safeExternalUrl(p.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#111] hover:bg-white/5 border border-white/5 hover:border-emerald-500/40 text-white transition-all text-xs font-mono group"
                  >
                    <span className="font-bold group-hover:text-emerald-400 transition-colors">
                      {p.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500 group-hover:bg-emerald-400 text-black font-bold text-[10px] uppercase shadow-sm">
                      {p.actionText}
                    </span>
                  </a>
                ))}
              </div>

              {/* Artist Bio Snippet */}
              {data.bio && (
                <div className="pt-3 border-t border-white/5 text-[11px] font-sans text-white/40 text-left">
                  <p className="line-clamp-3">{data.bio}</p>
                </div>
              )}

              <div className="pt-2 text-[10px] font-mono text-white/20">
                quick tools by indiebrotherhood
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
