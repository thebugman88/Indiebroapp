import React, { useRef, useState } from 'react';
import { Upload, Music, Disc, Sparkles, CheckCircle2, RefreshCw, FileAudio, ShieldAlert } from 'lucide-react';
import { TrackMetadata } from '../types';
import { validateAudioFileHeader, validateAudioFileSize, validateDecodedAudio } from '../audio/audioInput';
import { METADATA_LIMITS } from '../audio/metadataValidation';
import { AudioSessionGuard, SessionCancelledError } from '../audio/sessionGuard';

interface AudioUploaderProps {
  onAudioLoaded: (buffer: AudioBuffer, file: File | { name: string; size: number; type: string }) => void;
  currentFileName: string | null;
  audioBuffer: AudioBuffer | null;
  onClear: () => void;
  metadata: TrackMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<TrackMetadata>>;
  sessionGuard: AudioSessionGuard;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onAudioLoaded,
  currentFileName,
  audioBuffer,
  onClear,
  metadata,
  setMetadata,
  sessionGuard,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    sessionGuard.invalidate();
    const token = sessionGuard.capture();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Reject oversized declarations before allocating an ArrayBuffer for the file.
      validateAudioFileSize(file.size);
      const arrayBuffer = await file.arrayBuffer();
      token.throwIfCancelled();
      const declared = validateAudioFileHeader(file.size, new Uint8Array(arrayBuffer));
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let decoded: AudioBuffer;
      try {
        decoded = await ctx.decodeAudioData(arrayBuffer);
        token.throwIfCancelled();
        validateDecodedAudio(decoded, declared);
      } finally {
        await ctx.close();
      }

      // Auto-populate track title from filename if not yet set
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').slice(0, METADATA_LIMITS.title);
      token.throwIfCancelled();
      if (!metadata.title || metadata.title === 'Untitled Master') {
        setMetadata((prev) => ({
          ...prev,
          title: cleanTitle,
        }));
      }

      onAudioLoaded(decoded, file);
    } catch (err: any) {
      if (!token.isActive() || err instanceof SessionCancelledError) return;
      console.error('Audio decode error:', err);
      setErrorMsg(err?.message || 'Failed to decode audio file. Ensure the file is not corrupted.');
    } finally {
      if (token.isActive()) setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 lg:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {audioBuffer ? (
        // Loaded Audio Inspector State
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-zinc-950 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Disc className="w-7 h-7 animate-spin [animation-duration:8s]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Audio Ingested
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {audioBuffer.numberOfChannels === 2 ? 'Stereo' : 'Mono'} • {audioBuffer.sampleRate} Hz
                </span>
              </div>
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight mt-0.5 truncate max-w-md">
                {currentFileName || metadata.title || 'Mastering In Progress'}
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <span>Duration: <strong className="text-zinc-200">{formatDuration(audioBuffer.duration)}</strong></span>
                <span>•</span>
                <span>Samples: <strong className="text-zinc-200">{audioBuffer.length.toLocaleString()}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 32-Bit Float RAM Decoded
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Another File</span>
            </button>
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800/40 transition"
              title="Purge current audio from browser RAM"
            >
              <span>Discard Track</span>
            </button>
          </div>
        </div>
      ) : (
        // Empty State: Drag & Drop Ingestion Zone
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose a WAV or RF64 audio file"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10'
              : 'border-zinc-700/80 hover:border-amber-500/50 hover:bg-zinc-800/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".wav"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-black/40 group-hover:scale-105 transition">
            {isLoading ? (
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
            ) : (
              <Upload className="w-8 h-8 text-amber-400" />
            )}
          </div>

          <h3 className="text-base font-bold text-zinc-100 font-['Space_Grotesk']">
            {isLoading ? 'Decoding High-Precision PCM Audio...' : 'Drop your unmastered audio file here'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mt-1 mb-4">
            Accepts validated WAV/RF64 only: mono or stereo, 16/24-bit PCM or 32-bit float, 8–48 kHz, up to 5 minutes and 100 MB.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Audio Files
            </button>

          </div>

          {errorMsg && (
            <div className="mt-4 p-2.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
