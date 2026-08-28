import React, { useState } from 'react';
import {
  Disc3,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Trash2,
  FileText,
  Sparkles,
  Search,
  SlidersHorizontal,
  Bookmark,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { ArtistTrack, TrackGenre } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface VaultPlaylistViewProps {
  tracks: ArtistTrack[];
  savedTrackIds: string[];
  onRemoveFromVault: (trackId: string) => void;
  onNavigateToChamber: () => void;
}

export const VaultPlaylistView: React.FC<VaultPlaylistViewProps> = ({
  tracks,
  savedTrackIds,
  onRemoveFromVault,
  onNavigateToChamber
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewingLyricsTrack, setViewingLyricsTrack] = useState<ArtistTrack | null>(null);

  // Filter vault tracks
  const vaultTracks = tracks.filter((t) => savedTrackIds.includes(t.id));

  const filteredTracks = vaultTracks.filter((t) => {
    const matchesGenre = selectedGenre === 'All' || t.genre === selectedGenre;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mood.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const handlePlayTrack = (track: ArtistTrack) => {
    if (currentPlayingId === track.id && isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.loadTrack(track.audioBlobUrl, track.durationSeconds, track.synthPreset);
      audioEngine.play();
      setCurrentPlayingId(track.id);
      setIsPlaying(true);
    }
  };

  const allGenres = ['All', ...Array.from(new Set(vaultTracks.map((t) => t.genre)))];

  return (
    <div id="vault-playlist-root" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Vault Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
            <Disc3 className="w-3.5 h-3.5" /> CURATED VAULT & DISCOVERY PLAYLIST
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Unlocked Discoveries ({vaultTracks.length})
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            Tracks you audited blindly in the Judgement Chamber and added to your private collection. Stream, explore full lyrics, and organize by vibe.
          </p>
        </div>

        <button
          onClick={onNavigateToChamber}
          type="button"
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-bold text-xs font-mono flex items-center gap-2 transition shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          <span>Audit More in Chamber</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 sm:p-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, artist, or mood..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Genre Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {allGenres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition whitespace-nowrap ${
                selectedGenre === g
                  ? 'bg-amber-500 text-amber-950 font-bold'
                  : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Tracks Grid / List */}
      {filteredTracks.length === 0 ? (
        <div className="p-12 text-center bg-zinc-950 border border-zinc-800 rounded-3xl space-y-3">
          <Disc3 className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Tracks Found in Vault</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery || selectedGenre !== 'All'
              ? 'Try changing your search keywords or genre filter.'
              : 'Enter the Judgement Chamber, evaluate blind tracks, and save your favorites to your vault!'}
          </p>
          <button
            onClick={onNavigateToChamber}
            className="mt-3 px-6 py-2 rounded-xl bg-amber-500 text-amber-950 font-bold text-xs"
          >
            Enter Judgement Chamber
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.map((track) => {
            const isCurrentlyPlaying = currentPlayingId === track.id && isPlaying;
            return (
              <div
                key={track.id}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 shadow-xl transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Track Art & Play button */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden group mb-4">
                    <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                      <button
                        onClick={() => handlePlayTrack(track)}
                        type="button"
                        className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 flex items-center justify-center shadow-2xl transition active:scale-95 cursor-pointer"
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-950/90 text-amber-400 border border-zinc-800 backdrop-blur-md">
                        {track.genre}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-black bg-amber-500 text-amber-950 shadow">
                        ★ {track.aggregatedScores.overall || '8.5'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white truncate">{track.title}</h3>
                    <p className="text-xs font-bold text-amber-400 truncate">{track.artistName}</p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {track.mood} • {track.durationSeconds}s
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingLyricsTrack(track)}
                    type="button"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lyrics</span>
                  </button>

                  <button
                    onClick={() => onRemoveFromVault(track.id)}
                    type="button"
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition"
                    title="Remove from vault"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lyrics Viewer Modal */}
      {viewingLyricsTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{viewingLyricsTrack.title}</h3>
                <p className="text-xs text-amber-400 font-mono">{viewingLyricsTrack.artistName}</p>
              </div>
              <button
                onClick={() => setViewingLyricsTrack(null)}
                className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-300 leading-relaxed bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
              {viewingLyricsTrack.lyricsText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
