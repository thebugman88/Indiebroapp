import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { Header } from './components/Header';
import { UnsavedWarningBanner } from './components/UnsavedWarningBanner';
import { AudioUploader } from './components/AudioUploader';
import { VisualizerPanel } from './components/VisualizerPanel';
import { PlayerControls } from './components/PlayerControls';
import { MasteringConsole } from './components/MasteringConsole';
import { MetadataEditor } from './components/MetadataEditor';
import { StoreReadinessCard } from './components/StoreReadinessCard';
import { TermsAndPrivacyView } from './components/TermsAndPrivacyModal';
import { ProductionStatementsView } from './components/ProductionStatementsModal';
import { ExportModal } from './components/ExportModal';
import { GENRE_PRESETS } from './audio/presets';
import {
  buildMasteringDspGraph,
  analyzeAudioBuffer,
  MasteringNodes,
} from './audio/dsp';
import { MasteringPreset, TrackMetadata, AudioMetrics } from './types';
import { releaseAudioSession } from './audio/sessionCleanup';
import { AudioSessionGuard } from './audio/sessionGuard';

const createDefaultMetadata = (): TrackMetadata => ({
  title: '', artist: '', featuredArtists: '', album: '', trackNumber: '1', totalTracks: '1', discNumber: '1', year: '', genre: '', isrc: '', upc: '', composer: '', producer: '', label: '', copyright: '', phonographicCopyright: '', explicit: false, masteringEngineer: '', notes: '', coverArtUrl: null, coverArtBlob: null,
});

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'mastering' | 'metadata' | 'storeAudit' | 'production' | 'terms' | 'privacy'>('mastering');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // Audio State
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.85);

  // Mastering Preset & Metadata
  const [preset, setPreset] = useState<MasteringPreset>(GENRE_PRESETS.hiphop);
  const [metadata, setMetadata] = useState<TrackMetadata>(createDefaultMetadata);

  // Audio Metrics
  const [metrics, setMetrics] = useState<AudioMetrics>({
    currentLUFS: -70,
    shortTermLUFS: -70,
    integratedLUFS: -70,
    truePeakDb: -70,
    peakL: 0,
    peakR: 0,
    rmsL: 0,
    rmsR: 0,
    phaseCorrelation: 0,
    dynamicRangePLR: 0,
  });

  // Audio Context & Graph References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const masterNodesRef = useRef<MasteringNodes | null>(null);
  const volumeGainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const playbackTimerRef = useRef<number | null>(null);
  const artworkObjectUrlRef = useRef<string | null>(null);
  const sessionGuardRef = useRef(new AudioSessionGuard());

  useEffect(() => {
    artworkObjectUrlRef.current = metadata.coverArtUrl;
  }, [metadata.coverArtUrl]);

  // Ensure AudioContext is initialized
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Master Volume Gain Node
      const volNode = ctx.createGain();
      volNode.gain.value = masterVolume;
      volNode.connect(ctx.destination);
      volumeGainNodeRef.current = volNode;

      // Build Mastering DSP Graph
      const nodes = buildMasteringDspGraph(ctx, preset);
      nodes.outputNode.connect(volNode);
      masterNodesRef.current = nodes;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, [masterVolume, preset]);

  // Update volume when slider changes
  useEffect(() => {
    if (volumeGainNodeRef.current && audioCtxRef.current) {
      volumeGainNodeRef.current.gain.setTargetAtTime(masterVolume, audioCtxRef.current.currentTime, 0.02);
    }
  }, [masterVolume]);

  // Update DSP graph parameters dynamically
  useEffect(() => {
    if (masterNodesRef.current) {
      masterNodesRef.current.updateSettings(preset);
    }
  }, [preset]);

  // Update bypass state
  useEffect(() => {
    if (masterNodesRef.current) {
      masterNodesRef.current.setBypass(isBypassed);
    }
  }, [isBypassed]);

  // Audio playback stop handler
  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // already stopped
      }
      sourceNodeRef.current = null;
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const disposeAudioSession = useCallback(async () => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    playbackTimerRef.current = null;
    const nodes = masterNodesRef.current;
    const source = sourceNodeRef.current;
    const volumeNode = volumeGainNodeRef.current;
    const context = audioCtxRef.current;
    const artworkUrl = artworkObjectUrlRef.current;

    // Detach the old generation before awaiting close so a new session cannot
    // have its fresh references overwritten by completion of this cleanup.
    sourceNodeRef.current = null;
    masterNodesRef.current = null;
    volumeGainNodeRef.current = null;
    audioCtxRef.current = null;
    artworkObjectUrlRef.current = null;

    await releaseAudioSession({
      source,
      nodes: [nodes ? { disconnect: nodes.dispose } : null, volumeNode],
      context,
      objectUrls: [artworkUrl],
    });
  }, []);

  // Audio playback start handler
  const startPlayback = useCallback((offset = 0) => {
    if (!audioBuffer) return;
    const ctx = getAudioContext();
    stopPlayback();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = isLooping;

    if (masterNodesRef.current) {
      source.connect(masterNodesRef.current.inputNode);
    }

    const startAudioTime = ctx.currentTime;
    startTimeRef.current = startAudioTime - offset;
    pauseOffsetRef.current = offset;

    source.onended = () => {
      if (!isLooping) {
        setIsPlaying(false);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
          playbackTimerRef.current = null;
        }
      }
    };

    source.start(0, offset);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    // Track playback position
    playbackTimerRef.current = window.setInterval(() => {
      if (audioCtxRef.current && sourceNodeRef.current) {
        const elapsed = (audioCtxRef.current.currentTime - startTimeRef.current) % (audioBuffer.duration || 1);
        setCurrentTime(elapsed);
      }
    }, 60);
  }, [audioBuffer, isLooping, getAudioContext, stopPlayback]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (isPlaying) {
      if (audioCtxRef.current) {
        pauseOffsetRef.current = (audioCtxRef.current.currentTime - startTimeRef.current) % (duration || 1);
      }
      stopPlayback();
    } else {
      startPlayback(pauseOffsetRef.current);
    }
  };

  // Restart track
  const handleRestart = () => {
    pauseOffsetRef.current = 0;
    setCurrentTime(0);
    if (isPlaying) {
      startPlayback(0);
    }
  };

  // Seek scrub
  const handleSeek = (newTime: number) => {
    pauseOffsetRef.current = newTime;
    setCurrentTime(newTime);
    if (isPlaying) {
      startPlayback(newTime);
    }
  };

  // Loop toggle
  const handleToggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.loop = nextLoop;
    }
  };

  // When new audio buffer is ingested
  const handleAudioLoaded = (buffer: AudioBuffer, file: File | { name: string; size: number; type: string }) => {
    stopPlayback();
    setAudioBuffer(buffer);
    setDuration(buffer.duration);
    setCurrentTime(0);
    pauseOffsetRef.current = 0;
    setCurrentFileName(file.name);
    setHasDownloaded(false);

    // Compute real metrics from buffer
    const initialMetrics = analyzeAudioBuffer(buffer);
    setMetrics(initialMetrics);
  };

  // Clear track
  const handleClearTrack = () => {
    sessionGuardRef.current.invalidate();
    void disposeAudioSession();
    setAudioBuffer(null);
    setCurrentFileName(null);
    setCurrentTime(0);
    setDuration(0);
    pauseOffsetRef.current = 0;
    setHasDownloaded(false);
    setIsPlaying(false);
    setMetadata(createDefaultMetadata());
  };

  // Browser Unload Warning if user has unsaved track in RAM
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (audioBuffer && !hasDownloaded) {
        e.preventDefault();
        e.returnValue = 'You have an unmastered track in volatile memory. If you leave, your master will be permanently lost.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [audioBuffer, hasDownloaded]);

  useEffect(() => () => {
    sessionGuardRef.current.invalidate();
    void disposeAudioSession();
  }, [disposeAudioSession]);

  return (
    <div className="mastering-suite-root min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">

      {/* Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasTrack={Boolean(audioBuffer)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Unsaved export alert */}
      <UnsavedWarningBanner
        hasTrack={Boolean(audioBuffer)}
        onOpenExport={() => setIsExportOpen(true)}
        downloaded={hasDownloaded}
      />

      {/* Main Studio View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">

        {/* Tab 1: MASTERING SUITE */}
        {activeTab === 'mastering' && (
          <div className="space-y-6 animate-fade-in">

            {/* Audio Ingestion Zone */}
            <AudioUploader
              onAudioLoaded={handleAudioLoaded}
              currentFileName={currentFileName}
              audioBuffer={audioBuffer}
              onClear={handleClearTrack}
              metadata={metadata}
              setMetadata={setMetadata}
              sessionGuard={sessionGuardRef.current}
            />

            {/* Audio Player Controls */}
            {audioBuffer && (
              <PlayerControls
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onRestart={handleRestart}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                isLooping={isLooping}
                onToggleLoop={handleToggleLoop}
                isBypassed={isBypassed}
                onToggleBypass={() => setIsBypassed(!isBypassed)}
                masterVolume={masterVolume}
                setMasterVolume={setMasterVolume}
              />
            )}

            {/* Real-time Spectrum & Vectorscope Panel */}
            <VisualizerPanel
              analyserL={masterNodesRef.current?.analyserL || null}
              analyserR={masterNodesRef.current?.analyserR || null}
              analyserPost={masterNodesRef.current?.analyserPost || null}
              isPlaying={isPlaying}
              metrics={metrics}
              isBypassed={isBypassed}
            />

            {/* Main Mastering DSP Console */}
            <MasteringConsole
              preset={preset}
              setPreset={setPreset}
              onResetPreset={() => setPreset(GENRE_PRESETS[preset.genre] || GENRE_PRESETS.hiphop)}
            />
          </div>
        )}

        {/* Tab 2: RELEASE METADATA */}
        {activeTab === 'metadata' && (
          <div className="animate-fade-in">
            <MetadataEditor
              metadata={metadata}
              setMetadata={setMetadata}
              sessionGuard={sessionGuardRef.current}
              onOpenExport={() => setIsExportOpen(true)}
              hasTrack={Boolean(audioBuffer)}
            />
          </div>
        )}

        {/* Tab 3: STORE LOUDNESS AUDIT */}
        {activeTab === 'storeAudit' && (
          <div className="animate-fade-in">
            <StoreReadinessCard />
          </div>
        )}

        {/* Tab 4: PRODUCTION MANIFESTO */}
        {activeTab === 'production' && (
          <div className="animate-fade-in">
            <ProductionStatementsView />
          </div>
        )}

        {/* Tab 5: PRIVACY NOTES */}
        {activeTab === 'privacy' && (
          <div className="animate-fade-in">
            <TermsAndPrivacyView type="privacy" />
          </div>
        )}

        {/* Tab 6: TERMS OF SERVICE */}
        {activeTab === 'terms' && (
          <div className="animate-fade-in">
            <TermsAndPrivacyView type="terms" />
          </div>
        )}

      </main>

      {/* Global Export & Download Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        audioBuffer={audioBuffer}
        preset={preset}
        metadata={metadata}
        onDownloadCompleted={() => setHasDownloaded(true)}
        sessionGuard={sessionGuardRef.current}
      />

      {/* Studio Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 px-4 lg:px-8 py-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-300 font-semibold font-['Space_Grotesk']">
              Mastering suite by indiebrotherhood 2026
            </span>
            <span>•</span>
            <span>Local browser processing</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setActiveTab('privacy')} className="hover:text-amber-400 transition">
              Privacy Statement
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('terms')} className="hover:text-amber-400 transition">
              Terms of Service
            </button>
            <span>•</span>
            <button onClick={() => setActiveTab('production')} className="hover:text-amber-400 transition">
              Production Manifesto
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
