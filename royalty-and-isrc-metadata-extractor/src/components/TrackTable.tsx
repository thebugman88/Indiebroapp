import React, { useState } from 'react';
import { 
  Music, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Download, 
  Plus, 
  Filter, 
  CheckSquare, 
  Square,
  Search,
  Eye,
  Globe,
  Loader2,
  Sparkles
} from 'lucide-react';
import { ParsedTrack, Folder, MediaFile } from '../types';
import { resolveIsrcMetadata } from '../services/musicBrainz';

interface TrackTableProps {
  tracks: ParsedTrack[];
  folders: Folder[];
  files: MediaFile[];
  selectedTrackIds: string[];
  onToggleSelectTrack: (id: string) => void;
  onToggleSelectAll: () => void;
  onUpdateTrack: (track: ParsedTrack) => Promise<void>;
  onDeleteTrack: (id: string) => Promise<void>;
  onDeleteBatchTracks: (ids: string[]) => Promise<void>;
  onInspectFileForTrack: (fileId: string) => void;
  onOpenExportModal: () => void;
  onOpenManualTrackModal: () => void;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  folders,
  files,
  selectedTrackIds,
  onToggleSelectTrack,
  onToggleSelectAll,
  onUpdateTrack,
  onDeleteTrack,
  onDeleteBatchTracks,
  onInspectFileForTrack,
  onOpenExportModal,
  onOpenManualTrackModal,
}) => {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [verifyingTrackId, setVerifyingTrackId] = useState<string | null>(null);
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);

  // Filter tracks
  const filteredTracks = tracks.filter((t) => {
    if (platformFilter !== 'all' && t.platform !== platformFilter) return false;
    if (statusFilter === 'verified' && !t.validated) return false;
    if (statusFilter === 'unverified' && t.validated) return false;
    return true;
  });

  const handleInlineChange = (track: ParsedTrack, field: keyof ParsedTrack, value: any) => {
    const updated = {
      ...track,
      [field]: value,
      updatedAt: Date.now(),
    };
    onUpdateTrack(updated);
  };

  // Live ISRC verification via MusicBrainz & Deezer (100% Free Public APIs)
  const handleVerifyIsrcOnline = async (track: ParsedTrack) => {
    if (!track.isrc) return;
    setVerifyingTrackId(track.id);

    try {
      const meta = await resolveIsrcMetadata(track.isrc);
      if (meta.found) {
        const updated: ParsedTrack = {
          ...track,
          isrc: meta.isrc,
          title: meta.title || track.title,
          artist: meta.artist || track.artist,
          releaseTitle: meta.releaseTitle || track.releaseTitle,
          releaseDate: meta.releaseDate || track.releaseDate,
          duration: meta.duration || track.duration,
          label: meta.label || track.label,
          upc: meta.upc || track.upc,
          iswc: meta.iswc || track.iswc,
          coverArtUrl: meta.coverArtUrl || track.coverArtUrl,
          isrcVerifiedOnline: true,
          externalSource: meta.source,
          validated: true,
          updatedAt: Date.now(),
        };
        await onUpdateTrack(updated);
      } else {
        alert(`No official recording found on MusicBrainz/Deezer for ISRC: ${track.isrc}. Standard regex verification remains active.`);
      }
    } catch (err) {
      console.error('Online lookup failed:', err);
    } finally {
      setVerifyingTrackId(null);
    }
  };

  // Bulk online verification
  const handleBulkVerifyOnline = async () => {
    if (selectedTrackIds.length === 0) return;
    setIsBulkVerifying(true);

    for (const id of selectedTrackIds) {
      const track = tracks.find(t => t.id === id);
      if (track && track.isrc) {
        try {
          const meta = await resolveIsrcMetadata(track.isrc);
          if (meta.found) {
            await onUpdateTrack({
              ...track,
              isrc: meta.isrc,
              title: meta.title || track.title,
              artist: meta.artist || track.artist,
              releaseTitle: meta.releaseTitle || track.releaseTitle,
              releaseDate: meta.releaseDate || track.releaseDate,
              duration: meta.duration || track.duration,
              label: meta.label || track.label,
              upc: meta.upc || track.upc,
              iswc: meta.iswc || track.iswc,
              coverArtUrl: meta.coverArtUrl || track.coverArtUrl,
              isrcVerifiedOnline: true,
              externalSource: meta.source,
              validated: true,
              updatedAt: Date.now(),
            });
          }
        } catch (e) {
          console.warn('Bulk verify error:', e);
        }
      }
    }

    setIsBulkVerifying(false);
  };

  const getPlatformBadge = (platform?: string) => {
    switch (platform) {
      case 'Spotify':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'Apple Music':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'YouTube Music':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'SoundExchange':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Amazon Music':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'DistroKid':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b0f1a] overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-3 sm:p-5 lg:p-6 pb-2 sm:pb-3 max-w-7xl mx-auto w-full space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Music className="w-5 h-5 text-indigo-400" />
              <span>Extracted Royalties Data</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Showing {filteredTracks.length} records stored in IndexedDB persistence layer
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenManualTrackModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Track Entry</span>
            </button>

            <button
              onClick={onOpenExportModal}
              disabled={tracks.length === 0}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT .CSV {selectedTrackIds.length > 0 ? `(${selectedTrackIds.length})` : ''}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-y border-slate-800 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSelectAll}
              className="flex items-center space-x-1.5 text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-900 border border-slate-800"
            >
              {selectedTrackIds.length === filteredTracks.length && filteredTracks.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>{selectedTrackIds.length > 0 ? `${selectedTrackIds.length} Selected` : 'Select All'}</span>
            </button>

            {selectedTrackIds.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkVerifyOnline}
                  disabled={isBulkVerifying}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-semibold transition-colors"
                  title="Query MusicBrainz & Deezer to verify and enrich all selected ISRCs"
                >
                  {isBulkVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>Verify Online ({selectedTrackIds.length})</span>
                </button>

                <button
                  onClick={() => {
                    for (const id of selectedTrackIds) {
                      const t = tracks.find(x => x.id === id);
                      if (t) onUpdateTrack({ ...t, validated: true });
                    }
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Valid</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedTrackIds.length} selected tracks?`)) {
                      onDeleteBatchTracks(selectedTrackIds);
                    }
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Platform:</span>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
              >
                <option value="all">All Platforms</option>
                <option value="Spotify">Spotify</option>
                <option value="Apple Music">Apple Music</option>
                <option value="YouTube Music">YouTube Music</option>
                <option value="Amazon Music">Amazon Music</option>
                <option value="SoundExchange">SoundExchange</option>
                <option value="DistroKid">DistroKid</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Needs Review</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 overflow-y-auto pb-12">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-slate-800">
            <Music className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No tracks match current filters</h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Upload statements or add entries manually to begin managing metadata.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0f172a] border-b border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedTrackIds.length === filteredTracks.length && filteredTracks.length > 0}
                        onChange={onToggleSelectAll}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                    </th>
                    <th className="p-3">Track Title & Artist</th>
                    <th className="p-3">ISRC (Live MusicBrainz)</th>
                    <th className="p-3">ISWC</th>
                    <th className="p-3">Play Count</th>
                    <th className="p-3">Net Earned</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Splits</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredTracks.map((track) => {
                    const isSelected = selectedTrackIds.includes(track.id);
                    const isrcValid = track.isrc && /^[A-Z]{2}-?[A-Z0-9]{3}-?[0-9]{2}-?[0-9]{5}$/i.test(track.isrc);
                    const isVerifyingThis = verifyingTrackId === track.id;

                    return (
                      <tr
                        key={track.id}
                        className={`hover:bg-slate-800/30 group transition-colors ${
                          isSelected ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectTrack(track.id)}
                            className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                          />
                        </td>

                        {/* Title & Artist & Artwork */}
                        <td className="p-3 font-medium">
                          <div className="flex items-center gap-2.5">
                            {track.coverArtUrl ? (
                              <img
                                src={track.coverArtUrl}
                                alt=""
                                className="w-8 h-8 rounded object-cover border border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                <Music className="w-4 h-4 text-indigo-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={track.title}
                                onChange={(e) => handleInlineChange(track, 'title', e.target.value)}
                                className="w-full bg-transparent hover:bg-slate-800 px-1 py-0.5 rounded text-slate-100 font-semibold group-hover:text-indigo-400 focus:bg-slate-900 focus:outline-none font-sans"
                                placeholder="Track Title"
                              />
                              <input
                                type="text"
                                value={track.artist}
                                onChange={(e) => handleInlineChange(track, 'artist', e.target.value)}
                                className="w-full bg-transparent hover:bg-slate-800 px-1 py-0.5 rounded text-slate-400 text-[11px] focus:bg-slate-900 focus:outline-none font-sans"
                                placeholder="Artist Name"
                              />
                            </div>
                          </div>
                        </td>

                        {/* ISRC with Live Lookup Button */}
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              value={track.isrc || ''}
                              onChange={(e) => handleInlineChange(track, 'isrc', e.target.value.toUpperCase())}
                              className="font-mono text-slate-300 text-xs bg-transparent hover:bg-slate-800 px-1 py-0.5 rounded focus:bg-slate-900 focus:outline-none w-36"
                              placeholder="US-XXX-YY-NNNNN"
                            />
                            {track.isrc && (
                              <button
                                onClick={() => handleVerifyIsrcOnline(track)}
                                disabled={isVerifyingThis}
                                className={`p-1 rounded transition-colors ${
                                  track.isrcVerifiedOnline
                                    ? 'text-emerald-400 hover:bg-emerald-500/10'
                                    : 'text-indigo-400 hover:bg-indigo-500/10'
                                }`}
                                title={
                                  track.isrcVerifiedOnline
                                    ? `Verified on ${track.externalSource || 'MusicBrainz'}. Click to re-check.`
                                    : 'Click to query MusicBrainz & Deezer for official release metadata'
                                }
                              >
                                {isVerifyingThis ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : track.isrcVerifiedOnline ? (
                                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Globe className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* ISWC */}
                        <td className="p-3 font-mono text-slate-400">
                          <input
                            type="text"
                            value={track.iswc || ''}
                            onChange={(e) => handleInlineChange(track, 'iswc', e.target.value)}
                            className="text-xs bg-transparent hover:bg-slate-800 px-1 py-0.5 rounded focus:bg-slate-900 focus:outline-none w-28"
                            placeholder="T-123456789-0"
                          />
                        </td>

                        {/* Play Count */}
                        <td className="p-3 text-slate-200">
                          <input
                            type="number"
                            value={track.streams ?? ''}
                            onChange={(e) => handleInlineChange(track, 'streams', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="text-xs bg-transparent hover:bg-slate-800 px-1 py-0.5 rounded focus:bg-slate-900 focus:outline-none w-24 text-right"
                            placeholder="0"
                          />
                        </td>

                        {/* Net Earned */}
                        <td className="p-3 font-semibold text-emerald-400">
                          <div className="flex items-center space-x-0.5">
                            <span>{track.currency === 'USD' ? '$' : track.currency === 'EUR' ? '€' : track.currency === 'GBP' ? '£' : ''}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={track.revenue ?? ''}
                              onChange={(e) => handleInlineChange(track, 'revenue', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="text-xs bg-transparent hover:bg-slate-800 px-1 py-0.5 rounded focus:bg-slate-900 focus:outline-none w-20 text-right text-emerald-400 font-semibold"
                              placeholder="0.00"
                            />
                          </div>
                        </td>

                        {/* Platform */}
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${getPlatformBadge(track.platform)}`}>
                            {track.platform || 'Spotify'}
                          </span>
                        </td>

                        {/* Writers Splits */}
                        <td className="p-3 text-slate-300">
                          <div className="text-[11px] truncate max-w-[120px]" title={track.writers?.map(w => `${w.name} (${w.percentage}%)`).join(', ')}>
                            {track.writers && track.writers.length > 0 ? (
                              <span>{track.writers[0].name} ({track.writers[0].percentage}%)</span>
                            ) : (
                              <span className="text-slate-500">None</span>
                            )}
                          </div>
                        </td>

                        {/* Validation Status */}
                        <td className="p-3">
                          <button
                            onClick={() => handleInlineChange(track, 'validated', !track.validated)}
                            className={`flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                              track.validated
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {track.validated ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{track.isrcVerifiedOnline ? 'MB Valid' : 'Verified'}</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                <span>Review</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {track.fileId && (
                              <button
                                onClick={() => onInspectFileForTrack(track.fileId!)}
                                className="p-1 text-slate-400 hover:text-indigo-300"
                                title="Inspect Source Screenshot OCR"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteTrack(track.id)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="Delete track"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
