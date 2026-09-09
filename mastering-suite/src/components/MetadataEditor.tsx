import React, { useRef, useState } from 'react';
import {
  Disc3,
  Image as ImageIcon,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Music,
  User,
  Building,
  Calendar,
  KeyRound,
  X,
  FileCheck2
} from 'lucide-react';
import { TrackMetadata } from '../types';
import { isValidIsrc, normalizeIsrc, validateArtworkDimensions, validateArtworkFile, imageDimensionsFromHeader } from '../audio/audioInput';
import { AudioSessionGuard, createGuardedObjectUrl } from '../audio/sessionGuard';
import { METADATA_LIMITS } from '../audio/metadataValidation';

interface MetadataEditorProps {
  metadata: TrackMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<TrackMetadata>>;
  onOpenExport: () => void;
  hasTrack: boolean;
  sessionGuard: AudioSessionGuard;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  metadata,
  setMetadata,
  onOpenExport,
  hasTrack,
  sessionGuard,
}) => {
  const artInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [artworkError, setArtworkError] = useState<string | null>(null);
  const [isrcError, setIsrcError] = useState<string | null>(null);

  const handleArtUpload = async (file: File) => {
    sessionGuard.invalidate();
    const token = sessionGuard.capture();
    try {
      const url = await createGuardedObjectUrl({
        token,
        prepare: async () => {
          validateArtworkFile(file);
          validateArtworkDimensions(imageDimensionsFromHeader(new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer())));
          return file;
        },
        createObjectUrl: (value) => URL.createObjectURL(value),
        trackObjectUrl: (value) => sessionGuard.trackObjectUrl(value),
        revokeObjectUrl: (value) => sessionGuard.releaseObjectUrl(value),
      });
      if (!url || !token.isActive()) return;
      setArtworkError(null);
      setMetadata((prev) => {
        if (!token.isActive()) {
          sessionGuard.releaseObjectUrl(url);
          return prev;
        }
        if (prev.coverArtUrl) sessionGuard.releaseObjectUrl(prev.coverArtUrl);
        return { ...prev, coverArtUrl: url, coverArtBlob: file };
      });
    } catch (error: any) {
      if (!token.isActive()) return;
      setArtworkError(error?.message || 'Artwork could not be validated.');
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-zinc-800 rounded-2xl p-4 lg:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Disc3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-['Space_Grotesk']">
              WAV Release Metadata
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              WAV exports include limited RIFF INFO text fields; verify requirements with your distributor.
            </p>
          </div>
        </div>

        {hasTrack && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Proceed to Export</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Album Artwork Uploader (4 Cols) */}
        <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col items-center text-center">
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1 flex items-center gap-1.5 self-start">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Cover Artwork (1:1 Square)</span>
          </span>
          <p className="text-[11px] text-zinc-500 self-start mb-4">
            Optional local preview. Confirm artwork requirements independently.
          </p>

          <input
            type="file"
            ref={artInputRef}
            onChange={(e) => e.target.files?.[0] && handleArtUpload(e.target.files[0])}
            accept="image/jpeg,image/png"
            className="hidden"
          />

          {metadata.coverArtUrl ? (
            <div className="relative w-full aspect-square max-w-[260px] rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl group">
              <img
                src={metadata.coverArtUrl}
                alt="Album Cover Art"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-4">
                <button
                  type="button"
                  onClick={() => artInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold shadow transition hover:bg-amber-400"
                >
                  Change Artwork
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMetadata((prev) => {
                      if (prev.coverArtUrl) sessionGuard.releaseObjectUrl(prev.coverArtUrl);
                      return { ...prev, coverArtUrl: null, coverArtBlob: null };
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-red-950/80 text-red-300 text-xs font-bold border border-red-700 hover:bg-red-900"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Choose JPEG or PNG cover artwork"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) handleArtUpload(e.dataTransfer.files[0]);
              }}
              onClick={() => artInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  artInputRef.current?.click();
                }
              }}
              className={`w-full aspect-square max-w-[260px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer transition ${
                dragActive
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800/40'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-400 mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200">Upload Album Cover</span>
              <span className="text-[10px] text-zinc-500 mt-1">Drag & Drop or Click to browse</span>
            </div>
          )}

          <div className="w-full mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 text-left flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Artwork can be previewed locally but is not included in WAV export.</span>
          </div>
          {artworkError && <p className="mt-2 text-[11px] text-red-300">{artworkError}</p>}
        </div>

        {/* Right: Release Metadata Form (8 Cols) */}
        <div className="lg:col-span-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 lg:p-6 shadow-xl space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Track Title */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Track Title <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={metadata.title}
                maxLength={METADATA_LIMITS.title}
                onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Neon Horizon"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition"
              />
            </div>

            {/* Primary Artist */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Primary Artist Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={metadata.artist}
                maxLength={METADATA_LIMITS.artist}
                onChange={(e) => setMetadata((prev) => ({ ...prev, artist: e.target.value }))}
                placeholder="e.g. Solar Syndicate"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition"
              />
            </div>

            {/* Featured Artists */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Featured Artists (Optional)
              </label>
              <input
                type="text"
                value={metadata.featuredArtists}
                maxLength={METADATA_LIMITS.featuredArtists}
                onChange={(e) => setMetadata((prev) => ({ ...prev, featuredArtists: e.target.value }))}
                placeholder="e.g. Luna Ray, Vector X"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition"
              />
            </div>

            {/* Album / EP Title */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Album / EP / Single Title
              </label>
              <input
                type="text"
                value={metadata.album}
                maxLength={METADATA_LIMITS.album}
                onChange={(e) => setMetadata((prev) => ({ ...prev, album: e.target.value }))}
                placeholder="e.g. 2026 Master Series Vol. 1"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition"
              />
            </div>

            {/* Track Number & Total */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Track #</label>
                <input
                  type="text"
                  value={metadata.trackNumber}
                  maxLength={METADATA_LIMITS.trackNumber}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, trackNumber: e.target.value }))}
                  placeholder="1"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Total Tracks</label>
                <input
                  type="text"
                  value={metadata.totalTracks}
                  maxLength={METADATA_LIMITS.totalTracks}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, totalTracks: e.target.value }))}
                  placeholder="1"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Year & Genre */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Release Year</label>
                <input
                  type="text"
                  value={metadata.year}
                  maxLength={METADATA_LIMITS.year}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, year: e.target.value }))}
                  placeholder="2026"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Genre</label>
                <input
                  type="text"
                  value={metadata.genre}
                  maxLength={METADATA_LIMITS.genre}
                  onChange={(e) => setMetadata((prev) => ({ ...prev, genre: e.target.value }))}
                  placeholder="Electronic / Hip Hop"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Optional ISRC entered by the registrant or distributor. */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">
                  ISRC Code (International Standard)
                </label>
              </div>
              <input
                type="text"
                value={metadata.isrc}
                maxLength={METADATA_LIMITS.isrc}
                onChange={(e) => {
                  const value = e.target.value;
                  setMetadata((prev) => ({ ...prev, isrc: value }));
                  setIsrcError(isValidIsrc(value) ? null : 'Use a valid assigned ISRC, e.g. US-ABC-26-12345.');
                }}
                onBlur={(e) => {
                  if (isValidIsrc(e.target.value)) setMetadata((prev) => ({ ...prev, isrc: normalizeIsrc(e.target.value) }));
                }}
                placeholder="US-S1Z-26-00001"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-300 placeholder-zinc-600 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-zinc-500">Optional. This application does not issue ISRCs; obtain one from your registrant agency, label, or distributor.</p>
              {isrcError && <p className="mt-1 text-[10px] text-red-300">{isrcError}</p>}
            </div>

            {/* Record Label / Distributor */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Record Label / Publisher
              </label>
              <input
                type="text"
                value={metadata.label}
                maxLength={METADATA_LIMITS.label}
                onChange={(e) => setMetadata((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="indiebrotherhood records 2026"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>

            {/* Composer */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Composer / Songwriter</label>
              <input
                type="text"
                value={metadata.composer}
                maxLength={METADATA_LIMITS.composer}
                onChange={(e) => setMetadata((prev) => ({ ...prev, composer: e.target.value }))}
                placeholder="e.g. Christopher Ray"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>

            {/* Producer */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Music Producer</label>
              <input
                type="text"
                value={metadata.producer}
                maxLength={METADATA_LIMITS.producer}
                onChange={(e) => setMetadata((prev) => ({ ...prev, producer: e.target.value }))}
                placeholder="e.g. indiebrotherhood Audio Labs"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>

            {/* Copyright © */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Copyright Line (©)</label>
              <input
                type="text"
                value={metadata.copyright}
                maxLength={METADATA_LIMITS.copyright}
                onChange={(e) => setMetadata((prev) => ({ ...prev, copyright: e.target.value }))}
                placeholder="© 2026 All Rights Reserved"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>

            {/* Phonographic Copyright ℗ */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Phonographic Sound Recording (℗)</label>
              <input
                type="text"
                value={metadata.phonographicCopyright}
                maxLength={METADATA_LIMITS.phonographicCopyright}
                onChange={(e) => setMetadata((prev) => ({ ...prev, phonographicCopyright: e.target.value }))}
                placeholder="℗ 2026 indiebrotherhood"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
              />
            </div>

          </div>

          {/* Explicit Content Toggle & Engineer Notes */}
          <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="explicit-toggle"
                checked={metadata.explicit}
                onChange={(e) => setMetadata((prev) => ({ ...prev, explicit: e.target.checked }))}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="explicit-toggle" className="text-xs text-zinc-300 cursor-pointer">
                <strong className="text-zinc-100">Parental Advisory / Explicit Content</strong> (editor note only; WAV export does not encode this flag)
              </label>
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              Imprint: <span className="text-amber-400">indiebrotherhood 2026</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
