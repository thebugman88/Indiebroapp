import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  FileSpreadsheet, 
  HardDrive, 
  HelpCircle, 
  FileText, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  X,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface FooterProps {
  onOpenExport?: () => void;
  onOpenSettings?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenExport, onOpenSettings }) => {
  const [activeModal, setActiveModal] = useState<'help' | 'terms' | 'privacy' | null>(null);
  const [activeHelpTab, setActiveHelpTab] = useState<'ocr' | 'folders' | 'export' | 'storage' | 'security'>('ocr');

  return (
    <>
      <footer className="border-t border-slate-800 bg-[#0f172a] text-slate-400 select-none shrink-0 font-sans z-20">
        {/* Value Statements / Professional Feature Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Feature 1 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <div className="p-1.5 rounded-md bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Local OCR Engine</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Client-side Tesseract.js vision parses streaming statements & ISRCs directly on your machine.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <div className="p-1.5 rounded-md bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">100% Offline Storage</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Metadata & images are stored in browser IndexedDB with zero third-party leakage.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <div className="p-1.5 rounded-md bg-violet-600/10 text-violet-400 border border-violet-500/20 shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">PRO Export Ready</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Exports strictly formatted CSV tables tailored for ASCAP, The MLC, SoundExchange & DistroKid.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
              <div className="p-1.5 rounded-md bg-amber-600/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Songwriting Splits</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Track publisher shares, songwriter IPI numbers, and royalty allocations with verification badges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono">
          {/* Left: Copyright */}
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-300">© 2026 built by indiebrotherhood</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-indigo-400/80 text-[11px]">All Rights Reserved</span>
          </div>

          {/* Right: Interactive Links (Help, Terms, Privacy) */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              id="footer-help-btn"
              onClick={() => setActiveModal('help')}
              className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help & Functions</span>
            </button>

            <span className="text-slate-700">|</span>

            <button
              id="footer-terms-btn"
              onClick={() => setActiveModal('terms')}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>

            <span className="text-slate-700">|</span>

            <button
              id="footer-privacy-btn"
              onClick={() => setActiveModal('privacy')}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Help Section Modal */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">RoyaltyOps User Guide & Functions</h2>
                  <p className="text-xs text-slate-500 font-mono">Master your statement parsing, folder workflows, and PRO exports</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-full md:w-48 bg-[#070b14] border-b md:border-b-0 md:border-r border-slate-800 p-2 sm:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 font-mono text-xs">
                <button
                  onClick={() => setActiveHelpTab('ocr')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between ${
                    activeHelpTab === 'ocr' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span>1. OCR & Vision</span>
                  <ChevronRight className="w-3 h-3 hidden md:block" />
                </button>
                <button
                  onClick={() => setActiveHelpTab('folders')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between ${
                    activeHelpTab === 'folders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span>2. File Manager</span>
                  <ChevronRight className="w-3 h-3 hidden md:block" />
                </button>
                <button
                  onClick={() => setActiveHelpTab('export')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between ${
                    activeHelpTab === 'export' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span>3. Export Engine</span>
                  <ChevronRight className="w-3 h-3 hidden md:block" />
                </button>
                <button
                  onClick={() => setActiveHelpTab('storage')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between ${
                    activeHelpTab === 'storage' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span>4. Persistence</span>
                  <ChevronRight className="w-3 h-3 hidden md:block" />
                </button>
                <button
                  onClick={() => setActiveHelpTab('security')}
                  className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between ${
                    activeHelpTab === 'security' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span>5. Data Privacy</span>
                  <ChevronRight className="w-3 h-3 hidden md:block" />
                </button>
              </div>

              {/* Content Panel */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
                {activeHelpTab === 'ocr' && (
                  <div className="space-y-3 animate-in fade-in-50">
                    <div className="flex items-center space-x-2 text-indigo-400 font-mono font-bold text-sm">
                      <Cpu className="w-4 h-4" />
                      <span>Optical Character Recognition (OCR) Engine</span>
                    </div>
                    <p>
                      RoyaltyOps integrates an on-device Tesseract.js machine learning worker capable of reading PNG, JPG, and PDF statements locally without sending raw screenshots to any central server.
                    </p>
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-slate-100 font-mono text-[11px] uppercase tracking-wider">How to process statements:</h4>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                        <li>Drag & drop statement screenshots into the Upload dock or click <strong>Upload Statement</strong>.</li>
                        <li>The system automatically executes adaptive contrast pre-processing and initiates OCR.</li>
                        <li>Click <strong>Inspect</strong> on any file to examine the side-by-side zoomable image comparison and raw OCR character stream.</li>
                        <li>Edit any fields or add songwriter/publisher splits with instant validation.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {activeHelpTab === 'folders' && (
                  <div className="space-y-3 animate-in fade-in-50">
                    <div className="flex items-center space-x-2 text-indigo-400 font-mono font-bold text-sm">
                      <Layers className="w-4 h-4" />
                      <span>Custom Folders & Statement Sorting</span>
                    </div>
                    <p>
                      Organize thousands of statement receipts, distributor payouts, and PRO confirmations cleanly using custom color-coded folders before or after processing.
                    </p>
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-slate-100 font-mono text-[11px] uppercase tracking-wider">File System Capabilities:</h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li><strong>Create & Color:</strong> Click "+ New Folder" in the sidebar to assign custom hues (e.g., 2024_Q1, DistroKid_Payouts, Spotify_For_Artists).</li>
                        <li><strong>Batch Move:</strong> Select multiple documents and bulk move them into target folders in a single click.</li>
                        <li><strong>Batch OCR:</strong> Run or re-run text parsing across selected documents simultaneously.</li>
                        <li><strong>Grid / List toggle:</strong> Switch between high-density table views and visual thumbnail cards.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeHelpTab === 'export' && (
                  <div className="space-y-3 animate-in fade-in-50">
                    <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-sm">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Standardized PRO & Distributor Export Engine</span>
                    </div>
                    <p>
                      Different Performance Rights Organizations (PROs) and mechanical royalty databases require strict, incompatible column schemas for batch registration. RoyaltyOps formats and generates these instantly.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="font-bold text-slate-200 font-mono text-[11px]">ASCAP Works Registration</span>
                        <p className="text-slate-400 text-[11px] mt-1">Includes Work Title, ISRC, ISWC, Society codes, Writer splits, and Publisher shares.</p>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="font-bold text-slate-200 font-mono text-[11px]">The MLC Bulk Claim</span>
                        <p className="text-slate-400 text-[11px] mt-1">Formatted for The Mechanical Licensing Collective's bulk work claiming portal.</p>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="font-bold text-slate-200 font-mono text-[11px]">SoundExchange CWR</span>
                        <p className="text-slate-400 text-[11px] mt-1">Digital performance royalty claiming for featured artists and sound recording copyright owners.</p>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="font-bold text-slate-200 font-mono text-[11px]">Standard CSV / JSON</span>
                        <p className="text-slate-400 text-[11px] mt-1">Full raw data dump compatible with Excel, Google Sheets, or custom SQL databases.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeHelpTab === 'storage' && (
                  <div className="space-y-3 animate-in fade-in-50">
                    <div className="flex items-center space-x-2 text-violet-400 font-mono font-bold text-sm">
                      <HardDrive className="w-4 h-4" />
                      <span>Browser IndexedDB Local Persistence</span>
                    </div>
                    <p>
                      All uploaded statements, parsed track records, songwriter splits, and folder hierarchies are stored in your browser's persistent IndexedDB storage engine.
                    </p>
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <p className="text-slate-400 text-[11px]">
                        <strong>No Data Loss on Refresh:</strong> Reloading or navigating away preserves your entire catalog. You can export data anytime or completely wipe local data inside Settings if required.
                      </p>
                    </div>
                  </div>
                )}

                {activeHelpTab === 'security' && (
                  <div className="space-y-3 animate-in fade-in-50">
                    <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Security & Zero-Knowledge Architecture</span>
                    </div>
                    <p>
                      Royalty statements contain sensitive financial payouts, banking details, and unreleased song ISRC codes. RoyaltyOps ensures complete privacy by performing all computation inside your browser sandbox.
                    </p>
                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg text-emerald-300/90 text-[11px]">
                      ✓ No statement images uploaded to cloud databases.<br />
                      ✓ No telemetry tracking your earnings or streams.<br />
                      ✓ 100% client-side file conversions and CSV generation.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-[#0f172a] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-mono"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Terms of Service</h2>
                  <p className="text-[11px] text-slate-500 font-mono">Updated 2026 • indiebrotherhood</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
              <h3 className="font-bold text-slate-100 font-mono text-xs uppercase tracking-wider">1. Acceptance of Terms</h3>
              <p>
                By using the RoyaltyOps application built by indiebrotherhood, you agree to these Terms of Service. If you do not agree to these terms, do not use the application.
              </p>
              <h3 className="font-bold text-slate-100 font-mono text-xs uppercase tracking-wider">2. Use of Software</h3>
              <p>
                RoyaltyOps provides on-device optical character recognition and metadata transformation tools for independent musicians, record labels, and publishers. The software is provided "as is" without warranty of any kind.
              </p>
              <h3 className="font-bold text-slate-100 font-mono text-xs uppercase tracking-wider">3. Royalty Registration Accuracy</h3>
              <p>
                While the OCR engine parses standard distributor statements, users are solely responsible for inspecting and verifying the accuracy of ISRCs, ISWCs, songwriter split percentages, and publisher details prior to submitting registration files to PROs or distributors.
              </p>
              <h3 className="font-bold text-slate-100 font-mono text-xs uppercase tracking-wider">4. Intellectual Property</h3>
              <p>
                All rights, titles, and interests in and to RoyaltyOps are owned by indiebrotherhood. All royalty data, catalog assets, and uploaded materials remain the exclusive intellectual property of the respective creator.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-slate-800 bg-[#0f172a] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-mono"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Privacy Policy</h2>
                  <p className="text-[11px] text-slate-500 font-mono">Zero-Knowledge Architecture • 2026</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
              <h3 className="font-bold text-slate-100 font-mono text-xs uppercase tracking-wider">1. Zero Data Collection</h3>
              <p>
                RoyaltyOps operates strictly in a zero-knowledge, offline-first client runtime. We do not track, collect, store, or sell any personal financial data, artist names, streaming numbers, or banking statements.
              </p>
              <h3 className="font-bold text-slate-100 font-mono text-xs uppercase tracking-wider">2. Local Storage & Cookies</h3>
              <p>
                All data entered into the application—including uploaded screenshots, custom folder hierarchies, and extracted track records—is saved locally to your device using the browser's IndexedDB database engine.
              </p>
              <h3 className="font-bold text-slate-100 font-mono text-xs uppercase tracking-wider">3. Third-Party Vision APIs</h3>
              <p>
                Standard OCR processing is executed 100% on your local CPU/GPU using WebAssembly. If you optionally configure a custom API key for advanced vision models, requests are dispatched directly from your browser to the corresponding provider with no intermediary logging.
              </p>
              <h3 className="font-bold text-slate-100 font-mono text-xs uppercase tracking-wider">4. Data Deletion</h3>
              <p>
                You maintain complete control over your catalog. You can wipe all local storage data at any time via the Settings modal or by clearing your browser cache.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-slate-800 bg-[#0f172a] flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-mono"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
