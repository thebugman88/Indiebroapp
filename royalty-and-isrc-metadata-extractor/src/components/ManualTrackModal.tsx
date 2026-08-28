import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Music, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Globe,
  Loader2
} from 'lucide-react';
import { ParsedTrack, SplitShare, Folder, AppSettings } from '../types';
import { resolveIsrcMetadata } from '../services/musicBrainz';

interface ManualTrackModalProps {
  folders: Folder[];
  currentFolderId: string | null;
  settings: AppSettings;
  onSaveTrack: (track: ParsedTrack) => Promise<void>;
  onClose: () => void;
}

export const ManualTrackModal: React.FC<ManualTrackModalProps> = ({
  folders,
  currentFolderId,
  settings,
  onSaveTrack,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isrc, setIsrc] = useState(settings.isrcPrefix || '');
  const [iswc, setIswc] = useState('');
  const [streams, setStreams] = useState<string>('');
  const [revenue, setRevenue] = useState<string>('');
  const [platform, setPlatform] = useState<string>(settings.defaultPlatform || 'Spotify');
  const [duration, setDuration] = useState('03:30');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [releaseTitle, setReleaseTitle] = useState('');
  const [label, setLabel] = useState('Independent');
  const [upc, setUpc] = useState('');
  const [coverArtUrl, setCoverArtUrl] = useState<string | undefined>(undefined);
  const [externalSource, setExternalSource] = useState<string | undefined>(undefined);
  const [isrcVerifiedOnline, setIsrcVerifiedOnline] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(currentFolderId);

  const [writers, setWriters] = useState<SplitShare[]>([
    { id: `w-${Date.now()}`, name: '', role: 'Writer', percentage: 100 }
  ]);
  const [publishers, setPublishers] = useState<SplitShare[]>([
    { id: `p-${Date.now()}`, name: 'Direct / Self-Published', role: 'Publisher', percentage: 100 }
  ]);

  // Live ISRC Lookup via MusicBrainz & Deezer
  const handleLookupIsrc = async () => {
    if (!isrc.trim()) return;
    setIsLookingUp(true);

    try {
      const meta = await resolveIsrcMetadata(isrc.trim());
      if (meta.found) {
        if (meta.title && !title) setTitle(meta.title);
        if (meta.artist && !artist) setArtist(meta.artist);
        if (meta.releaseTitle) setReleaseTitle(meta.releaseTitle);
        if (meta.releaseDate) setReleaseDate(meta.releaseDate);
        if (meta.duration) setDuration(meta.duration);
        if (meta.label) setLabel(meta.label);
        if (meta.upc) setUpc(meta.upc);
        if (meta.iswc) setIswc(meta.iswc);
        if (meta.coverArtUrl) setCoverArtUrl(meta.coverArtUrl);
        setIsrc(meta.isrc);
        setExternalSource(meta.source);
        setIsrcVerifiedOnline(true);
      } else {
        alert(`No recording found in MusicBrainz/Deezer for ISRC: ${isrc}. You can still register it manually.`);
      }
    } catch (err) {
      console.warn('Manual ISRC lookup failed:', err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddWriter = () => {
    setWriters([...writers, { id: `w-${Date.now()}`, name: '', role: 'Writer', percentage: 0 }]);
  };

  const handleUpdateWriter = (index: number, field: keyof SplitShare, val: any) => {
    const copy = [...writers];
    copy[index] = { ...copy[index], [field]: val };
    setWriters(copy);
  };

  const handleRemoveWriter = (index: number) => {
    setWriters(writers.filter((_, i) => i !== index));
  };

  const handleAddPublisher = () => {
    setPublishers([...publishers, { id: `p-${Date.now()}`, name: '', role: 'Publisher', percentage: 0 }]);
  };

  const handleUpdatePublisher = (index: number, field: keyof SplitShare, val: any) => {
    const copy = [...publishers];
    copy[index] = { ...copy[index], [field]: val };
    setPublishers(copy);
  };

  const handleRemovePublisher = (index: number) => {
    setPublishers(publishers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      alert('Please provide at least Song Title and Artist');
      return;
    }

    const newTrack: ParsedTrack = {
      id: `trk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileId: null,
      folderId,
      title: title.trim(),
      artist: artist.trim(),
      isrc: isrc.trim().toUpperCase(),
      iswc: iswc.trim() || undefined,
      streams: streams ? parseInt(streams, 10) : undefined,
      revenue: revenue ? parseFloat(revenue) : undefined,
      currency: settings.defaultCurrency || 'USD',
      platform,
      duration: duration.trim() || '03:30',
      releaseDate,
      releaseTitle: (releaseTitle || title).trim(),
      label: label.trim() || 'Independent',
      upc: upc.trim() || undefined,
      coverArtUrl,
      isrcVerifiedOnline,
      externalSource,
      pLine: `${releaseDate ? releaseDate.substring(0, 4) : new Date().getFullYear()} ${artist.trim()}`,
      writers: writers.filter(w => w.name.trim() !== ''),
      publishers: publishers.filter(p => p.name.trim() !== ''),
      confidence: 100,
      validated: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Fallback if writer names were empty
    if (newTrack.writers.length === 0) {
      newTrack.writers = [{ id: `w-${Date.now()}`, name: artist.trim(), role: 'Writer', percentage: 100 }];
    }

    await onSaveTrack(newTrack);
    onClose();
  };

  const totalWriterShare = writers.reduce((sum, w) => sum + (Number(w.percentage) || 0), 0);
  const totalPubShare = publishers.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b0f1a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Add Track Metadata Manually</h2>
              <p className="text-xs text-slate-500 font-mono">Live MusicBrainz / Deezer Lookup, Revenue, and Songwriting Splits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ISRC Fast Autofill Banner */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto-Fill from MusicBrainz & Deezer (Free)</span>
              </span>
              {isrcVerifiedOnline && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  Verified on {externalSource}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={isrc}
                onChange={(e) => setIsrc(e.target.value.toUpperCase())}
                placeholder="Enter ISRC (e.g. US-AT2-19-00135)..."
                className="flex-1 text-xs px-3 py-2 font-mono bg-[#0b0f1a] border border-slate-800 rounded-lg text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleLookupIsrc}
                disabled={isLookingUp || !isrc.trim()}
                className="px-3.5 py-2 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Auto-Fill</span>
              </button>
            </div>
          </div>

          {/* Core Information */}
          <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
              Core Song Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Track Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Celestial Echoes"
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Primary Artist *
                </label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Luna Horizon"
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Release / Album Title
                </label>
                <input
                  type="text"
                  value={releaseTitle}
                  onChange={(e) => setReleaseTitle(e.target.value)}
                  placeholder="e.g. Solar Odyssey EP"
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ISWC (Musical Work Code)
                </label>
                <input
                  type="text"
                  value={iswc}
                  onChange={(e) => setIswc(e.target.value)}
                  placeholder="T-123456789-0"
                  className="w-full text-xs px-3 py-2 font-mono bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Platform & Streams */}
          <div className="space-y-4 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
              DSP & Payout Data
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Streams Count
                </label>
                <input
                  type="number"
                  value={streams}
                  onChange={(e) => setStreams(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gross Revenue ({settings.defaultCurrency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-emerald-400 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  DSP Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Spotify">Spotify</option>
                  <option value="Apple Music">Apple Music</option>
                  <option value="YouTube Music">YouTube Music</option>
                  <option value="Amazon Music">Amazon Music</option>
                  <option value="SoundExchange">SoundExchange</option>
                  <option value="DistroKid">DistroKid</option>
                  <option value="TuneCore">TuneCore</option>
                  <option value="Tidal">Tidal</option>
                  <option value="Other">Other / Master</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="03:30"
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Folder
                </label>
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value || null)}
                  className="w-full text-xs px-3 py-2 bg-[#0b0f1a] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Unsorted Uploads</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Writers Splits */}
          <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-violet-400 uppercase tracking-widest">
                  Songwriter Splits
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  totalWriterShare === 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {totalWriterShare}%
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddWriter}
                className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>Add Writer</span>
              </button>
            </div>

            {writers.map((w, idx) => (
              <div key={w.id || idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={w.name}
                  onChange={(e) => handleUpdateWriter(idx, 'name', e.target.value)}
                  placeholder="Writer Full Name"
                  className="flex-1 text-xs px-2.5 py-1.5 bg-[#0b0f1a] border border-slate-800 rounded text-slate-100 focus:outline-none font-sans"
                />
                <input
                  type="text"
                  value={w.ipi || ''}
                  onChange={(e) => handleUpdateWriter(idx, 'ipi', e.target.value)}
                  placeholder="IPI Number"
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
                {writers.length > 1 && (
                  <button
                    type="button"
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
                  Publisher Splits
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  totalPubShare === 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {totalPubShare}%
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddPublisher}
                className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>Add Publisher</span>
              </button>
            </div>

            {publishers.map((p, idx) => (
              <div key={p.id || idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => handleUpdatePublisher(idx, 'name', e.target.value)}
                  placeholder="Publisher Entity Name"
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
                {publishers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePublisher(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-[#0f172a] font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Track</span>
          </button>
        </div>
      </div>
    </div>
  );
};
