import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Sliders, 
  Globe, 
  DollarSign, 
  Trash2, 
  Check, 
  HardDrive,
  Eye,
  AlertTriangle,
  Sparkles,
  Key,
  Database,
  ExternalLink,
  Shield
} from 'lucide-react';
import { AppSettings, OcrEngineMode } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onClearAllData: () => Promise<void>;
  onClose: () => void;
}

const OCR_LANGUAGES = [
  { code: 'eng', name: 'English (Default)' },
  { code: 'spa', name: 'Spanish (Español)' },
  { code: 'fra', name: 'French (Français)' },
  { code: 'deu', name: 'German (Deutsch)' },
  { code: 'ita', name: 'Italian (Italiano)' },
  { code: 'por', name: 'Portuguese (Português)' },
  { code: 'jpn', name: 'Japanese (日本語)' },
  { code: 'kor', name: 'Korean (한국어)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClearAllData,
  onClose,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearDatabase = async () => {
    await onClearAllData();
    setShowClearConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">App & OCR Configuration</h2>
              <p className="text-xs text-slate-500 font-mono">Dual Vision Engines, Free API Keys, and Offline Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dual Vision OCR Engine Selector */}
          <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                <span>Vision & Extraction Engine</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Select Engine Mode</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, ocrEngine: 'tesseract' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  formData.ocrEngine === 'tesseract'
                    ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 ring-1 ring-indigo-500'
                    : 'bg-[#0b0f1a] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Local Tesseract.js</span>
                  {formData.ocrEngine === 'tesseract' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  100% Free & Offline. Runs on your device WebAssembly with zero API keys required.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, ocrEngine: 'gemini' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  formData.ocrEngine === 'gemini'
                    ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 ring-1 ring-indigo-500'
                    : 'bg-[#0b0f1a] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">Google Gemini AI Vision</span>
                  {formData.ocrEngine === 'gemini' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Ultra-high precision for noisy distributor statements, multi-column grids, and PDF reports.
                </p>
              </button>
            </div>

            {/* Gemini API Key Input (Shown if Gemini selected or optional) */}
            {formData.ocrEngine === 'gemini' && (
              <div className="space-y-2 pt-2 border-t border-slate-800 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Google Gemini API Key (Free Tier Available)</span>
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                  >
                    <span>Get Free Key at Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={formData.geminiApiKey}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 font-sans">
                  Your key stays in this page’s memory and is sent directly to Google when using BYOK. It is not saved; re-enter it after reload. Provider usage may be billed to your account.
                </p>
              </div>
            )}

            {/* Online ISRC Auto-Lookup Toggle */}
            <div className="pt-2 border-t border-slate-800 font-sans space-y-2">
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoLookupIsrcOnline}
                  onChange={(e) => setFormData({ ...formData, autoLookupIsrcOnline: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="font-semibold text-slate-200">
                  Auto-Enrich with MusicBrainz & Deezer (100% Free Public APIs)
                </span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6">
                Automatically queries MusicBrainz and Deezer to fetch official release titles, recording dates, album covers, and ISWCs upon statement parsing.
              </p>
            </div>
          </div>

          {/* Core Configuration & Preprocessing */}
          <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
              <Sliders className="w-4 h-4" />
              <span>Language & Preprocessing Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tesseract Language
                </label>
                <select
                  value={formData.ocrLanguage}
                  onChange={(e) => setFormData({ ...formData, ocrLanguage: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {OCR_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Default Royalty Currency
                </label>
                <select
                  value={formData.defaultCurrency}
                  onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  <option value="AUD">AUD ($ - Australian Dollar)</option>
                  <option value="JPY">JPY (¥ - Japanese Yen)</option>
                </select>
              </div>
            </div>

            {/* Preprocessing Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800 font-sans">
              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoPreprocessImage}
                  onChange={(e) => setFormData({ ...formData, autoPreprocessImage: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Auto-Preprocess Screenshots (Grayscale & Contrast boost before OCR)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enhanceContrast}
                  onChange={(e) => setFormData({ ...formData, enhanceContrast: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>High-Contrast Enhancement (sharpens dark text on dark backgrounds)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.binarizeThreshold}
                  onChange={(e) => setFormData({ ...formData, binarizeThreshold: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Adaptive Black & White Binarization (Best for blurry statements)</span>
              </label>
            </div>
          </div>

          {/* Reset & Storage management */}
          <div className="space-y-3 bg-rose-950/20 p-4 rounded-xl border border-rose-500/20 font-mono">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-rose-400 uppercase tracking-widest">
              <AlertTriangle className="w-4 h-4" />
              <span>Database Storage Reset</span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Permanently wipe all locally stored screenshots, parsed track records, and custom folders from browser IndexedDB.
            </p>
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition-colors"
              >
                Clear All Data
              </button>
            ) : (
              <div className="flex items-center space-x-3 bg-rose-950/40 p-3 rounded-lg border border-rose-500/40">
                <span className="text-xs text-rose-200">Are you sure? This cannot be undone.</span>
                <button
                  type="button"
                  onClick={handleClearDatabase}
                  className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded"
                >
                  Yes, Wipe Database
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#0f172a] font-mono">
          <div>
            {isSaved && (
              <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Settings saved successfully</span>
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
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
