import React, { useState, useRef } from 'react';
import { Upload, Music, Check, Play, Pause, FileAudio } from 'lucide-react';

interface AudioInputSectionProps {
  selectedAudioName: string;
  artistName: string;
  audioData: string | null;
  audioUrl: string;
  inputMethod: 'file';
  mimeType: string;
  onAudioSelected: (data: {
    audioName: string;
    artistName: string;
    audioData: string | null;
    audioUrl: string;
    inputMethod: 'file';
    mimeType: string;
  }) => void;
}

export const AudioInputSection: React.FC<AudioInputSectionProps> = ({
  selectedAudioName,
  artistName,
  audioData,
  audioUrl,
  inputMethod,
  mimeType,
  onAudioSelected,
}) => {
  const [titleInput, setTitleInput] = useState(selectedAudioName);
  const [artistInput, setArtistInput] = useState(artistName);
  const [dragActive, setDragActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    
    // Extract name without extension
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onAudioSelected({
        audioName: titleInput || cleanName,
        artistName: artistInput || "Indie Artist",
        audioData: result,
        audioUrl: URL.createObjectURL(file),
        inputMethod: 'file',
        mimeType: file.type || 'audio/mp3',
      });
      setTitleInput(cleanName);
    };

    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const effectiveAudioSource = audioUrl || (audioData && audioData.startsWith("data:") ? audioData : null);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      
      {/* One real audio source feeds both analyzers. */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-indigo-400" />
            Song & Audio Source
          </h2>
          <p className="text-xs text-slate-400">
            Upload one unreleased audio file for either free local measurements or the full AI analysis.
          </p>
        </div>

        <div className="flex bg-indigo-600 text-white shadow p-2 rounded-xl border border-indigo-500">
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold">
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </div>
        </div>
      </div>

      {/* Metadata Fields (Song Title & Artist) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Song Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => {
              setTitleInput(e.target.value);
              if (selectedAudioName) {
                onAudioSelected({
                  audioName: e.target.value,
                  artistName: artistInput,
                  audioData,
                  audioUrl,
                  inputMethod,
                  mimeType,
                });
              }
            }}
            placeholder="e.g. Midnight Highway"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Artist / Producer Name
          </label>
          <input
            type="text"
            value={artistInput}
            onChange={(e) => {
              setArtistInput(e.target.value);
              if (selectedAudioName) {
                onAudioSelected({
                  audioName: titleInput,
                  artistName: e.target.value,
                  audioData,
                  audioUrl,
                  inputMethod,
                  mimeType,
                });
              }
            }}
            placeholder="e.g. IndieBrotherhood"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Active Tab View */}
      <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : selectedAudioName && inputMethod === 'file'
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.flac"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <div className="w-12 h-12 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            {selectedAudioName && inputMethod === 'file' ? (
              <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Loaded: {selectedAudioName}
              </span>
            ) : (
              'Drag & drop audio track here or click to browse'
            )}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Supports MP3, WAV, M4A, AAC, FLAC (Max 50MB). Only 100% original unreleased tracks.
          </p>
        </div>

      {/* Audio Player Preview */}
      {selectedAudioName && (
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAudioPlay}
              className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">{selectedAudioName}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {inputMethod}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {artistName || "Indie Artist"} • Ready for 2026 Hit Analysis
              </p>
            </div>
          </div>

          {effectiveAudioSource && (
            <audio
              ref={audioRef}
              src={effectiveAudioSource}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-semibold text-emerald-400">Audio Ready</span>
          </div>
        </div>
      )}

    </div>
  );
};
