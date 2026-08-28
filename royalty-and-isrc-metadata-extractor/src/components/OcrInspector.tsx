import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Sparkles, 
  FileText, 
  Layers, 
  Sliders,
  DollarSign,
  Music,
  User,
  Disc,
  Clock,
  ShieldCheck,
  Globe,
  Loader2
} from 'lucide-react';
import { MediaFile, ParsedTrack, SplitShare, AppSettings } from '../types';
import { parseOcrTextToTracks } from '../services/parser';
import { resolveIsrcMetadata } from '../services/musicBrainz';


interface OcrInspectorProps {
  file: MediaFile;
  tracks: ParsedTrack[];
  settings: AppSettings;
  onClose: () => void;
  onRunOcr: (fileId: string) => Promise<void>;
  onSaveTrack: (track: ParsedTrack) => Promise<void>;
  onAddTrackToFile: (fileId: string) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
  onUpdateRawText: (fileId: string, newText: string) => Promise<void>;
  isProcessing: boolean;
}

export const OcrInspector: React.FC<OcrInspectorProps> = ({
  file,
  tracks,
  settings,
  onClose,
  onRunOcr,
  onSaveTrack,
  onAddTrackToFile,
  onDeleteTrack,
  onUpdateRawText,
  isProcessing,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<'tracks' | 'rawText'>('tracks');
  const [rawTextValue, setRawTextValue] = useState(file.rawOcrText || '');
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isVerifyingIsrc, setIsVerifyingIsrc] = useState(false);

  useEffect(() => {
    setRawTextValue(file.rawOcrText || '');
  }, [file.rawOcrText]);

  const currentTrack = tracks[selectedTrackIndex] || tracks[0];

  // Live ISRC lookup via MusicBrainz & Deezer
  const handleVerifyIsrcOnline = async () => {
    if (!currentTrack || !currentTrack.isrc) return;
    setIsVerifyingIsrc(true);
    try {
      const meta = await resolveIsrcMetadata(currentTrack.isrc);
      if (meta.found) {
        const updated: ParsedTrack = {
          ...currentTrack,
          isrc: meta.isrc,
          title: meta.title || currentTrack.title,
          artist: meta.artist || currentTrack.artist,
          releaseTitle: meta.releaseTitle || currentTrack.releaseTitle,
          releaseDate: meta.releaseDate || currentTrack.releaseDate,
          duration: meta.duration || currentTrack.duration,
          label: meta.label || currentTrack.label,
          upc: meta.upc || currentTrack.upc,
          iswc: meta.iswc || currentTrack.iswc,
          coverArtUrl: meta.coverArtUrl || currentTrack.coverArtUrl,
          isrcVerifiedOnline: true,
          externalSource: meta.source,
          validated: true,
          updatedAt: Date.now(),
        };
        await onSaveTrack(updated);
      } else {
        alert(`No official recording found in MusicBrainz/Deezer for ISRC: ${currentTrack.isrc}`);
      }
    } catch (e) {
      console.warn('Online verification failed:', e);
    } finally {
      setIsVerifyingIsrc(false);
    }
  };

  // Handle re-parse from edited raw text
  const handleReparseRawText = async () => {
    await onUpdateRawText(file.id, rawTextValue);
    const parsed = parseOcrTextToTracks(rawTextValue, file.id, file.folderId, settings.defaultCurrency);
    for (const t of parsed) {
      await onSaveTrack(t);
    }
  };


  const handleTrackFieldChange = (field: keyof ParsedTrack, value: any) => {
    if (!currentTrack) return;
    const updated = {
      ...currentTrack,
      [field]: value,
      updatedAt: Date.now(),
    };
    onSaveTrack(updated);
  };

  const handleAddWriter = () => {
    if (!currentTrack) return;
    const newWriter: SplitShare = {
      id: `w-${Date.now()}`,
      name: '',
      role: 'Writer',
      percentage: 0,
    };
    handleTrackFieldChange('writers', [...currentTrack.writers, newWriter]);
  };

  const handleUpdateWriter = (index: number, field: keyof SplitShare, val: any) => {
    if (!currentTrack) return;
    const updatedWriters = [...currentTrack.writers];
    updatedWriters[index] = { ...updatedWriters[index], [field]: val };
    handleTrackFieldChange('writers', updatedWriters);
  };

  const handleRemoveWriter = (index: number) => {
    if (!currentTrack) return;
    const updated = currentTrack.writers.filter((_, i) => i !== index);
    handleTrackFieldChange('writers', updated);
  };

  const handleAddPublisher = () => {
    if (!currentTrack) return;
    const newPub: SplitShare = {
      id: `p-${Date.now()}`,
      name: '',
      role: 'Publisher',
      percentage: 0,
    };
    handleTrackFieldChange('publishers', [...currentTrack.publishers, newPub]);
  };

  const handleUpdatePublisher = (index: number, field: keyof SplitShare, val: any) => {
    if (!currentTrack) return;
    const updatedPubs = [...currentTrack.publishers];
    updatedPubs[index] = { ...updatedPubs[index], [field]: val };
    handleTrackFieldChange('publishers', updatedPubs);
  };

  const handleRemovePublisher = (index: number) => {
    if (!currentTrack) return;
    const updated = currentTrack.publishers.filter((_, i) => i !== index);
    handleTrackFieldChange('publishers', updated);
  };

  const totalWriterShare = currentTrack?.writers?.reduce((sum, w) => sum + (Number(w.percentage) || 0), 0) ?? 0;
  const totalPubShare = currentTrack?.publishers?.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm">
      <div className="flex-1 flex flex-col bg-[#0b0f1a] border-l border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 truncate max-w-md">
                {file.name}
              </h2>
              <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono mt-0.5">
                <span>STATUS: <strong className="text-indigo-400 uppercase">{file.status}</strong></span>
                <span>•</span>
                <span>TRACKS: <strong className="text-slate-300">{tracks.length}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onRunOcr(file.id)}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 font-mono"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Scanning...' : 'Re-Run OCR'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split View: Left Image Preview / Right Extracted Editor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Image Inspector with Zoom */}
          <div className="w-full md:w-1/2 flex flex-col border-r border-slate-800 bg-[#070b14]">
            {/* Image Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0f172a] border-b border-slate-800 text-xs text-slate-400 font-mono">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Source Screenshot</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1 hover:text-white hover:bg-slate-800 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  className="p-1 hover:text-white hover:bg-slate-800 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:text-white hover:bg-slate-800 rounded"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Zoom Container */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#070b14]">
              {file.dataUrl ? (
                <div 
                  className="transition-transform duration-150 origin-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="max-w-full rounded shadow-2xl border border-slate-800 pointer-events-none"
                  />
                </div>
              ) : (
                <div className="text-slate-600 text-xs font-mono">No image preview available</div>
              )}
            </div>
          </div>

          {/* Right Panel: Metadata & OCR Inspector */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#0b0f1a] overflow-hidden">
            {/* Tab navigation */}
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-[#0f172a] font-mono">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('tracks')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    activeTab === 'tracks'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Extracted Tracks ({tracks.length})
                </button>
                <button
                  onClick={() => setActiveTab('rawText')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    activeTab === 'rawText'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Raw OCR Text & Parser
                </button>
              </div>

              {activeTab === 'tracks' && (
                <button
                  onClick={() => onAddTrackToFile(file.id)}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
                >
                  <Plus className="w-3 h-3 text-indigo-400" />
                  <span>Add Track</span>
                </button>
              )}
            </div>

            {/* Tab Content: Tracks Editor */}
            {activeTab === 'tracks' ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Track Selector Pills */}
                {tracks.length > 1 && (
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800 font-mono">
                    {tracks.map((t, idx) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTrackIndex(idx)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                          selectedTrackIndex === idx
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 ring-1 ring-indigo-500/30'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        #{idx + 1}: {t.title || 'Untitled'}
                      </button>
                    ))}
                  </div>
                )}

                {currentTrack ? (
                  <div className="space-y-5">
                    {/* Primary Details Card */}
                    <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                          Core Metadata
                        </span>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentTrack.validated}
                              onChange={(e) => handleTrackFieldChange('validated', e.target.checked)}
                              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                            />
                            <span>Verified Valid</span>
                          </label>
                          <button
                            onClick={() => onDeleteTrack(currentTrack.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete this track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Song / Track Title *
                          </label>
                          <input
                            type="text"
                            value={currentTrack.title}
                            onChange={(e) => handleTrackFieldChange('title', e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans"
                            placeholder="e.g. Midnight Drive"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Primary Recording Artist *
                          </label>
                          <input
                            type="text"
                            value={currentTrack.artist}
                            onChange={(e) => handleTrackFieldChange('artist', e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans"
                            placeholder="e.g. Solar Echoes"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span>ISRC Code *</span>
                              {currentTrack.isrcVerifiedOnline && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                                  {currentTrack.externalSource || 'MusicBrainz'}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">CC-XXX-YY-NNNNN</span>
                          </label>
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              value={currentTrack.isrc}
                              onChange={(e) => handleTrackFieldChange('isrc', e.target.value.toUpperCase())}
                              className="flex-1 text-xs px-3 py-2 font-mono bg-[#0b0f1a] border border-slate-800 rounded-lg text-indigo-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              placeholder="US-S1Z-24-00123"
                            />
                            {currentTrack.isrc && (
                              <button
                                type="button"
                                onClick={handleVerifyIsrcOnline}
                                disabled={isVerifyingIsrc}
                                className={`px-2.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1 border transition-colors ${
                                  currentTrack.isrcVerifiedOnline
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                                }`}
                                title="Query MusicBrainz & Deezer to verify and fill official release metadata"
                              >
                                {isVerifyingIsrc ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Globe className="w-3.5 h-3.5" />
                                )}
                                <span>{currentTrack.isrcVerifiedOnline ? 'Verified' : 'Verify'}</span>
                              </button>
                            )}
                          </div>
                        </div>


                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            ISWC (Musical Work Code)
                          </label>
                          <input
                            type="text"
                            value={currentTrack.iswc || ''}
                            onChange={(e) => handleTrackFieldChange('iswc', e.target.value)}
                            className="w-full text-xs px-3 py-2 font-mono bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="T-123456789-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Royalty & Stream Stats */}
                    <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                        Streams & Revenue Figures
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Streams / Plays
                          </label>
                          <input
                            type="number"
                            value={currentTrack.streams ?? ''}
                            onChange={(e) => handleTrackFieldChange('streams', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g. 145020"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Gross Revenue ({currentTrack.currency})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={currentTrack.revenue ?? ''}
                            onChange={(e) => handleTrackFieldChange('revenue', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-emerald-400 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Platform / DSP
                          </label>
                          <select
                            value={currentTrack.platform || 'Spotify'}
                            onChange={(e) => handleTrackFieldChange('platform', e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="Spotify">Spotify</option>
                            <option value="Apple Music">Apple Music</option>
                            <option value="YouTube Music">YouTube Music</option>
                            <option value="Amazon Music">Amazon Music</option>
                            <option value="DistroKid">DistroKid</option>
                            <option value="SoundExchange">SoundExchange</option>
                            <option value="TuneCore">TuneCore</option>
                            <option value="CD Baby">CD Baby</option>
                            <option value="Tidal">Tidal</option>
                            <option value="Other">Other / Master</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={currentTrack.duration || ''}
                            onChange={(e) => handleTrackFieldChange('duration', e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="03:45"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Release Date
                          </label>
                          <input
                            type="date"
                            value={currentTrack.releaseDate || ''}
                            onChange={(e) => handleTrackFieldChange('releaseDate', e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Record Label / Copyright
                          </label>
                          <input
                            type="text"
                            value={currentTrack.label || ''}
                            onChange={(e) => handleTrackFieldChange('label', e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g. Independent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Writers & Songwriting Splits */}
                    <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">
                            Songwriter Splits
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            totalWriterShare === 100 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            Total: {totalWriterShare}%
                          </span>
                        </div>
                        <button
                          onClick={handleAddWriter}
                          className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Writer</span>
                        </button>
                      </div>

                      {currentTrack.writers.map((w, idx) => (
                        <div key={w.id || idx} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={w.name}
                            onChange={(e) => handleUpdateWriter(idx, 'name', e.target.value)}
                            placeholder="Full Name"
                            className="flex-1 text-xs px-2.5 py-1.5 bg-[#0b0f1a] border border-slate-800 rounded text-slate-100 focus:outline-none font-sans"
                          />
                          <input
                            type="text"
                            value={w.ipi || ''}
                            onChange={(e) => handleUpdateWriter(idx, 'ipi', e.target.value)}
                            placeholder="IPI / CAE"
                            className="w-28 text-xs px-2.5 py-1.5 bg-[#0b0f1a] border border-slate-800 rounded text-slate-100 focus:outline-none font-mono"
                          />
                          <div className="flex items-center space-x-1 w-20">
                            <input
                              type="number"
                              value={w.percentage}
                              onChange={(e) => handleUpdateWriter(idx, 'percentage', parseFloat(e.target.value) || 0)}
                              className="w-14 text-xs px-2 py-1.5 bg-[#0b0f1a] border border-slate-800 rounded text-slate-100 focus:outline-none text-right font-mono"
                            />
                            <span className="text-xs text-slate-400 font-mono">%</span>
                          </div>
                          {currentTrack.writers.length > 1 && (
                            <button
                              onClick={() => handleRemoveWriter(idx)}
                              className="p-1.5 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Publishers Splits */}
                    <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">
                            Publishers & Administrators
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            totalPubShare === 100 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            Total: {totalPubShare}%
                          </span>
                        </div>
                        <button
                          onClick={handleAddPublisher}
                          className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Publisher</span>
                        </button>
                      </div>

                      {currentTrack.publishers.map((p, idx) => (
                        <div key={p.id || idx} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => handleUpdatePublisher(idx, 'name', e.target.value)}
                            placeholder="Publisher / Entity Name"
                            className="flex-1 text-xs px-2.5 py-1.5 bg-[#0b0f1a] border border-slate-800 rounded text-slate-100 focus:outline-none font-sans"
                          />
                          <input
                            type="text"
                            value={p.ipi || ''}
                            onChange={(e) => handleUpdatePublisher(idx, 'ipi', e.target.value)}
                            placeholder="Publisher IPI"
                            className="w-28 text-xs px-2.5 py-1.5 bg-[#0b0f1a] border border-slate-800 rounded text-slate-100 focus:outline-none font-mono"
                          />
                          <div className="flex items-center space-x-1 w-20">
                            <input
                              type="number"
                              value={p.percentage}
                              onChange={(e) => handleUpdatePublisher(idx, 'percentage', parseFloat(e.target.value) || 0)}
                              className="w-14 text-xs px-2 py-1.5 bg-[#0b0f1a] border border-slate-800 rounded text-slate-100 focus:outline-none text-right font-mono"
                            />
                            <span className="text-xs text-slate-400 font-mono">%</span>
                          </div>
                          {currentTrack.publishers.length > 1 && (
                            <button
                              onClick={() => handleRemovePublisher(idx)}
                              className="p-1.5 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 font-mono">
                    <p className="text-xs text-slate-400">No tracks extracted from this screenshot yet.</p>
                    <button
                      onClick={() => onAddTrackToFile(file.id)}
                      className="mt-3 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-600/20"
                    >
                      + Create Track Entry Manually
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Raw OCR Text tab */
              <div className="flex-1 flex flex-col p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-mono">
                    Raw text extracted by Tesseract OCR engine. Correct OCR typos below and click re-parse.
                  </p>
                  <button
                    onClick={handleReparseRawText}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 font-mono"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Re-Parse Text</span>
                  </button>
                </div>

                <textarea
                  value={rawTextValue}
                  onChange={(e) => setRawTextValue(e.target.value)}
                  className="flex-1 w-full p-4 font-mono text-xs bg-[#070b14] border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed"
                  placeholder="Raw OCR characters will appear here..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
