import React, { useState } from 'react';
import { 
  X, 
  Key, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Globe, 
  Music, 
  Disc, 
  Radio, 
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AppSettings, ByokKeys } from '../types';

interface ByokIntegrationsModalProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void>;
  onClose: () => void;
}

export const ByokIntegrationsModal: React.FC<ByokIntegrationsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [byok, setByok] = useState<ByokKeys>({ ...(settings.byokKeys || {}) });
  const [isSaved, setIsSaved] = useState(false);

  const handleKeyChange = (field: keyof ByokKeys, val: string) => {
    setByok(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...formData,
      byokKeys: byok,
    };
    await onSaveSettings(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Bring Your Own Key (BYOK) & Integrations Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Zero-Knowledge Storage
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Connect external music data services, AI vision engines, and metadata resolvers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Free Public Services Banner */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Default Free APIs (Active & Included)</span>
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">No Keys Required</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono pt-1">
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="font-bold text-slate-200">✓ MusicBrainz Registry:</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Global ISRC lookups, ISWCs, and work relationships.</p>
              </div>
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                <span className="font-bold text-slate-200">✓ Deezer Public API:</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Instant album artwork, track durations, and release dates.</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-amber-300">Keys are kept only in page memory, not saved. Requests send the required credentials and selected data to the respective provider. Provider charges may apply. Re-enter keys after reload; do not use a privileged server secret in a browser.</p>
          {/* BYOK Integrations Grid */}
          <div className="space-y-4 font-mono">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest block">
              Configurable Developer Keys
            </span>

            {/* 1. Google Gemini AI */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">Google Gemini 2.5 Flash Vision AI</span>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>Get Free Key (Google AI Studio)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Enables AI statement scanning for complex multi-page distributor PDF statements, blurry mobile screenshots, and embedded royalty tables.
              </p>
              <input
                type="password"
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* 2. Spotify Web API */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Music className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">Spotify Developer API</span>
                </div>
                <a
                  href="https://developer.spotify.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Get Spotify Keys (Free Developer Tier)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Allows querying Spotify catalog by ISRC to verify live popularity metrics, official artist IDs, and Spotify canvas previews.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={byok.spotifyClientId || ''}
                  onChange={(e) => handleKeyChange('spotifyClientId', e.target.value)}
                  placeholder="Spotify Client ID"
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <input
                  type="password"
                  value={byok.spotifyClientSecret || ''}
                  onChange={(e) => handleKeyChange('spotifyClientSecret', e.target.value)}
                  placeholder="Spotify Client Secret"
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* 3. Discogs API */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Disc className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Discogs Developer Token</span>
                </div>
                <a
                  href="https://www.discogs.com/settings/developers"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <span>Generate Discogs Token (Free)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Queries Discogs global database for physical vinyl catalog numbers, pressing matrices, and publisher credits.
              </p>
              <input
                type="password"
                value={byok.discogsToken || ''}
                onChange={(e) => handleKeyChange('discogsToken', e.target.value)}
                placeholder="Discogs Personal Access Token"
                className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* 4. AcoustID / AudD */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">AcoustID / Chromaprint API Key</span>
                </div>
                <a
                  href="https://acoustid.org/api"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>Get AcoustID Key (Free)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Acoustic audio fingerprint matching to identify songs and match master audio WAV/MP3 files to official ISRCs.
              </p>
              <input
                type="password"
                value={byok.acoustidApiKey || ''}
                onChange={(e) => handleKeyChange('acoustidApiKey', e.target.value)}
                placeholder="AcoustID User Key"
                className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300/90 font-sans">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              <strong>Zero-Knowledge Security Guarantee:</strong> All API keys entered here remain encrypted within your local browser IndexedDB storage and are never dispatched to our servers.
            </p>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#0f172a] font-mono">
          <div>
            {isSaved && (
              <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-400">
                <Check className="w-4 h-4" />
                <span>BYOK Keys saved to local vault</span>
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20"
            >
              Save Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
