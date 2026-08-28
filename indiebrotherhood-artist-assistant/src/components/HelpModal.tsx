import React, { useState } from "react";
import { X, HelpCircle, BookOpen, Music, DollarSign, Send, CheckCircle } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"royalties" | "identifiers" | "pitching" | "exports">("royalties");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Indie Artist Career Playbook & Guide</h2>
              <p className="text-xs text-slate-400">Essential 2026 Music Industry Royalty, Metadata & Strategy Reference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("royalties")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "royalties"
                ? "border-indigo-500 text-indigo-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>The 4 Royalty Streams</span>
          </button>

          <button
            onClick={() => setActiveTab("identifiers")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "identifiers"
                ? "border-indigo-500 text-indigo-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>ISRC vs ISWC vs UPC</span>
          </button>

          <button
            onClick={() => setActiveTab("pitching")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "pitching"
                ? "border-indigo-500 text-indigo-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Editorial Pitching Rules</span>
          </button>

          <button
            onClick={() => setActiveTab("exports")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "exports"
                ? "border-indigo-500 text-indigo-300 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Registration Formats</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === "royalties" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h4 className="text-sm font-semibold text-emerald-300 mb-1">1. Master Streaming Royalties (DSP Payouts)</h4>
                <p className="text-slate-400">
                  Collected by your digital distributor (DistroKid, TuneCore, CD Baby, Symphonic). Generated when listeners stream your sound recording on Spotify, Apple Music, Tidal, Amazon, and YouTube Music.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h4 className="text-sm font-semibold text-indigo-300 mb-1">2. Performance Royalties (ASCAP / BMI / SESAC / PRS / SOCAN)</h4>
                <p className="text-slate-400">
                  Generated whenever your composition is performed publicly — including radio, TV, bars, concerts, satellite radio, and interactive streaming performance shares. Split 50% to Writer and 50% to Publisher.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h4 className="text-sm font-semibold text-amber-300 mb-1">3. Mechanical Royalties (The MLC in USA / MCPS in UK)</h4>
                <p className="text-slate-400">
                  Generated every time your composition is reproduced mechanically or streamed interactively on Spotify/Apple Music. In the USA, The MLC collects and distributes 100% of these statutory mechanicals directly to songwriters and publishers with zero commission.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h4 className="text-sm font-semibold text-rose-300 mb-1">4. Non-Interactive Digital Sound Recording Royalties (SoundExchange)</h4>
                <p className="text-slate-400">
                  Generated when your sound recording is played on non-interactive streaming (Pandora radio stations, SiriusXM, web radio). Split strictly: <strong>45% to the Featured Recording Artist</strong>, 50% to the Master Rights Owner/Label, and 5% to AFM non-featured session musicians.
                </p>
              </div>
            </div>
          )}

          {activeTab === "identifiers" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700">
                <h4 className="text-sm font-semibold text-indigo-300">ISRC (International Standard Recording Code)</h4>
                <p className="text-slate-400 mt-1">
                  12 characters (e.g. <code>US-S1Z-26-00001</code>). Identifies the specific <em>sound recording / master audio</em> track. Assigned by your distributor or your national ISRC agency.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700">
                <h4 className="text-sm font-semibold text-amber-300">ISWC (International Standard Musical Work Code)</h4>
                <p className="text-slate-400 mt-1">
                  Unique identifier for the underlying <em>musical composition / songwriting work</em> (e.g. <code>T-123456789-0</code>). Assigned automatically by your PRO (ASCAP/BMI) once a work is registered.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700">
                <h4 className="text-sm font-semibold text-emerald-300">IPI / CAE Number</h4>
                <p className="text-slate-400 mt-1">
                  Your 9-to-11 digit unique international songwriter/publisher identity code assigned by ASCAP, BMI, or your local PRO. Essential for split sheet agreements.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700">
                <h4 className="text-sm font-semibold text-rose-300">UPC / EAN (Barcode)</h4>
                <p className="text-slate-400 mt-1">
                  12-13 digit universal code identifying the entire single, EP, or album product package for digital and physical distribution.
                </p>
              </div>
            </div>
          )}

          {activeTab === "pitching" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2">
                <h4 className="text-sm font-bold text-slate-100">Spotify for Artists Editorial Pitching Formula</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Submit 7 to 21 days before release:</strong> Curators review submissions weeks ahead. Submitting the day before guarantees you will miss the editorial review queue.</li>
                  <li><strong>Accurate Genre & Mood Tags:</strong> Do not guess random tags; accurately describe the sonic instruments (e.g. 'Acoustic Guitar', '808 Bass', 'Warm Synth Pads').</li>
                  <li><strong>The 500-Character Story Hook:</strong> Lead with the emotional trigger or real-life inspiration of the song. Mention specific organic marketing drivers (e.g., '15K TikTok teaser views', 'Touring support in Pacific Northwest', 'Previous support on Fresh Finds').</li>
                  <li><strong>Release City & Cultural Context:</strong> Editors curate regional showcases (e.g. 'Fresh Finds Indie', 'All New Indie', 'Chill Vibes', 'New Music Friday').</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "exports" && (
            <div className="space-y-3">
              <p className="text-slate-300">
                The IndieArtist Career OS builds direct CSV & HTML downloads formatted to the exact schema required by major collection societies:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <strong className="text-indigo-300">ASCAP Work Registration:</strong>
                  <p className="text-slate-400 mt-0.5">Compatible with ASCAP's online bulk repertoire upload format.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <strong className="text-amber-300">The MLC Bulk Registration:</strong>
                  <p className="text-slate-400 mt-0.5">Includes mechanical share breakdown and recording ISRC cross-link.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <strong className="text-emerald-300">SoundExchange ISRC Export:</strong>
                  <p className="text-slate-400 mt-0.5">Matches SoundExchange's repertoire sound recording upload template.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                  <strong className="text-rose-300">Song Split Agreement:</strong>
                  <p className="text-slate-400 mt-0.5">Generates clean printable legal contracts for co-writers and producers.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Need specific advice? Ask the Career Assistant in the chat tab.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
