import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  FileAudio,
  Disc3,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  HardDriveDownload,
  Music,
  Lock
} from 'lucide-react';
import { AudioFormat, MasteringPreset, TrackMetadata } from '../types';
import { renderMasterOffline } from '../audio/dsp';
import { encodeWavBuffer } from '../audio/wavEncoder';
import { AudioSessionGuard, SessionCancelledError } from '../audio/sessionGuard';
import { runGuardedExport } from '../audio/guardedExport';
import { buildSafeWavFilename, validateMetadataForExport } from '../audio/metadataValidation';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioBuffer: AudioBuffer | null;
  preset: MasteringPreset;
  metadata: TrackMetadata;
  onDownloadCompleted: () => void;
  sessionGuard: AudioSessionGuard;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  audioBuffer,
  preset,
  metadata,
  onDownloadCompleted,
  sessionGuard,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('wav-24');
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const downloadUrlsRef = useRef(new Map<string, number>());
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => {
    for (const [url, timer] of downloadUrlsRef.current) {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    downloadUrlsRef.current.clear();
  }, []);

  useEffect(() => sessionGuard.onInvalidate(() => {
    for (const [url, timer] of downloadUrlsRef.current) {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    downloadUrlsRef.current.clear();
  }), [sessionGuard]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        sessionGuard.invalidate();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose, sessionGuard]);

  if (!isOpen) return null;

  const handleExportAndDownload = async () => {
    if (!audioBuffer) return;
    sessionGuard.invalidate();
    const token = sessionGuard.capture();

    setIsRendering(true);
    setRenderProgress(10);
    setStatusMessage('Preparing local Web Audio render...');
    setDownloadSuccess(false);

    try {
      // Step 1: Render Master through DSP OfflineAudioContext
      setStatusMessage('Executing offline acoustic mastering render...');
      setRenderProgress(30);

      const bitDepth = selectedFormat === 'wav-16' ? 16 : 24;
      validateMetadataForExport(metadata);
      const filename = buildSafeWavFilename(metadata.artist, metadata.title);
      const downloadUrl = await runGuardedExport({
        token,
        render: () => renderMasterOffline(audioBuffer, preset, (pct) => {
          if (token.isActive()) setRenderProgress(Math.floor(30 + pct * 0.4));
        }),
        encode: (renderedBuffer) => {
          token.throwIfCancelled();
          setStatusMessage('Encoding PCM WAV with limited RIFF INFO text metadata...');
          setRenderProgress(80);
          return new Blob([encodeWavBuffer(renderedBuffer, bitDepth, metadata)], { type: 'audio/wav' });
        },
        createObjectUrl: (blob) => URL.createObjectURL(blob),
        trackObjectUrl: (url) => sessionGuard.trackObjectUrl(url),
        revokeObjectUrl: (url) => sessionGuard.releaseObjectUrl(url),
        triggerDownload: (url) => {
          token.throwIfCancelled();
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
        },
      });
      const revokeTimer = window.setTimeout(() => {
        sessionGuard.releaseObjectUrl(downloadUrl);
        downloadUrlsRef.current.delete(downloadUrl);
      }, 4000);
      downloadUrlsRef.current.set(downloadUrl, revokeTimer);
      setRenderProgress(100);
      setStatusMessage('Master Downloaded Successfully!');
      setDownloadSuccess(true);
      onDownloadCompleted();
    } catch (err: any) {
      if (!token.isActive() || err instanceof SessionCancelledError) return;
      console.error('Mastering export error:', err);
        setDownloadSuccess(false);
        setStatusMessage(`Export Error: ${err?.message || 'Failed to render audio master.'}`);
    } finally {
      if (token.isActive()) setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="mastering-export-title" className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <div>
              <h3 id="mastering-export-title" className="text-base font-bold text-zinc-100 font-['Space_Grotesk']">
                Export WAV Master
              </h3>
              <p className="text-[11px] text-zinc-400">
                Mastering suite by indiebrotherhood 2026 • Local WAV Rendering
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => { sessionGuard.invalidate(); onClose(); }}
            aria-label="Close WAV export dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">

          {/* Format Selection Grid */}
          <div>
            <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider block mb-2">
              Select Output Container & Bitrate
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

              {/* WAV 24-bit */}
              <button
                type="button"
                onClick={() => setSelectedFormat('wav-24')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  selectedFormat === 'wav-24'
                    ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-400/40 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">WAV 24-Bit Studio Master</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    PCM
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  24-bit PCM WAV for workflows that accept this format. Confirm delivery requirements independently.
                </p>
              </button>

              {/* WAV 16-bit */}
              <button
                type="button"
                onClick={() => setSelectedFormat('wav-16')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  selectedFormat === 'wav-16'
                    ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-400/40 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">WAV 16-Bit PCM</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                    16-bit
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  16-bit PCM WAV at the decoded source sample rate. Confirm delivery requirements independently.
                </p>
              </button>


            </div>
          </div>

          {/* Critical Security & RAM Warning */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200/90 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Local Processing & Data Notice</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              This application processes audio locally in the browser code. It does not implement uploads in this client. Save exports promptly; browser and deployment behavior may vary.
            </p>
          </div>

          {/* Active Rendering Progress */}
          {isRendering && (
            <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex justify-between text-xs font-mono text-zinc-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>{statusMessage}</span>
                </span>
                <span className="text-amber-400 font-bold">{renderProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-150"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                WAV downloaded. Verify the file and any distributor requirements independently.
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => { sessionGuard.invalidate(); onClose(); }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleExportAndDownload}
            disabled={isRendering || !audioBuffer}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
          >
            {isRendering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Render & Download Master</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
