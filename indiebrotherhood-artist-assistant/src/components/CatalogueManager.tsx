import React, { useState } from "react";
import {
  Music,
  Plus,
  Edit,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Users,
  DollarSign,
  Download,
  FileText,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { ArtistProfile, SongMetadata, SongWriter, ProType, SongRole } from "../types";
import { exportPlatformData } from "../lib/exportEngine";
import confetti from "canvas-confetti";

interface CatalogueManagerProps {
  songs: SongMetadata[];
  profile: ArtistProfile;
  onAddSong: (song: SongMetadata) => void;
  onUpdateSong: (song: SongMetadata) => void;
  onDeleteSong: (id: string) => void;
  onOpenAssistantForSong?: (song: SongMetadata) => void;
}

export const CatalogueManager: React.FC<CatalogueManagerProps> = ({
  songs,
  profile,
  onAddSong,
  onUpdateSong,
  onDeleteSong,
  onOpenAssistantForSong,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [editingSong, setEditingSong] = useState<SongMetadata | null>(null);
  const [isNewSong, setIsNewSong] = useState(false);

  // Form State for Add / Edit Modal
  const [formTitle, setFormTitle] = useState("");
  const [formAltTitles, setFormAltTitles] = useState("");
  const [formArtist, setFormArtist] = useState(profile.artistName || "");
  const [formFeatured, setFormFeatured] = useState("");
  const [formIsrc, setFormIsrc] = useState("");
  const [formIswc, setFormIswc] = useState("");
  const [formUpc, setFormUpc] = useState("");
  const [formReleaseDate, setFormReleaseDate] = useState("");
  const [formDuration, setFormDuration] = useState("03:30");
  const [formGenre, setFormGenre] = useState(profile.genre || "Indie");
  const [formDistributor, setFormDistributor] = useState(profile.distributor || "Independent");
  const [formPLine, setFormPLine] = useState(`(P) ${new Date().getFullYear()} ${profile.artistName || "Independent"}`);
  const [formCLine, setFormCLine] = useState(`(C) ${new Date().getFullYear()} ${profile.artistName || "Independent"}`);
  const [formExplicit, setFormExplicit] = useState(false);
  const [formNotes, setFormNotes] = useState("");
  const [formWriters, setFormWriters] = useState<SongWriter[]>([]);

  const genres = Array.from(new Set(songs.map((s) => s.genre).filter(Boolean)));

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.isrc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.primaryArtist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "all" || song.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const handleOpenAddModal = () => {
    setIsNewSong(true);
    setFormTitle("");
    setFormAltTitles("");
    setFormArtist(profile.artistName || "");
    setFormFeatured("");
    setFormIsrc("");
    setFormIswc("");
    setFormUpc("");
    setFormReleaseDate(new Date().toISOString().slice(0, 10));
    setFormDuration("03:30");
    setFormGenre(profile.genre || "Indie");
    setFormDistributor(profile.distributor || "Independent");
    setFormPLine(`(P) ${new Date().getFullYear()} ${profile.artistName || "Independent"}`);
    setFormCLine(`(C) ${new Date().getFullYear()} ${profile.artistName || "Independent"}`);
    setFormExplicit(false);
    setFormNotes("");
    setFormWriters([
      {
        id: `w_${Date.now()}`,
        name: profile.artistName || "Primary Songwriter",
        ipi: profile.ipi || "",
        pro: profile.pro || "ASCAP",
        role: "Composer",
        writerSplitPercent: 100,
        publisherName: profile.publisher || "Self-Published",
        publisherIpi: "",
        publisherPro: profile.pro || "ASCAP",
        publisherSplitPercent: 100,
      },
    ]);
    setEditingSong({
      id: `song_${Date.now()}`,
      title: "",
      alternativeTitles: [],
      primaryArtist: profile.artistName || "",
      featuredArtists: [],
      isrc: "",
      iswc: "",
      upc: "",
      releaseDate: new Date().toISOString().slice(0, 10),
      duration: "03:30",
      genre: "Indie",
      labelOrDistributor: "Independent",
      pLine: "",
      cLine: "",
      explicit: false,
      writers: [],
      streams: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleOpenEditModal = (song: SongMetadata) => {
    setIsNewSong(false);
    setEditingSong(song);
    setFormTitle(song.title);
    setFormAltTitles((song.alternativeTitles || []).join(", "));
    setFormArtist(song.primaryArtist);
    setFormFeatured((song.featuredArtists || []).join(", "));
    setFormIsrc(song.isrc);
    setFormIswc(song.iswc);
    setFormUpc(song.upc);
    setFormReleaseDate(song.releaseDate);
    setFormDuration(song.duration);
    setFormGenre(song.genre);
    setFormDistributor(song.labelOrDistributor);
    setFormPLine(song.pLine);
    setFormCLine(song.cLine);
    setFormExplicit(song.explicit);
    setFormNotes(song.notes || "");
    setFormWriters(song.writers && song.writers.length > 0 ? song.writers : [
      {
        id: `w_${Date.now()}`,
        name: song.primaryArtist || profile.artistName || "Writer",
        ipi: profile.ipi || "",
        pro: profile.pro || "ASCAP",
        role: "Composer",
        writerSplitPercent: 100,
        publisherName: profile.publisher || "Self-Published",
        publisherIpi: "",
        publisherPro: profile.pro || "ASCAP",
        publisherSplitPercent: 100,
      }
    ]);
  };

  const handleAddWriter = () => {
    const newWriter: SongWriter = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: "",
      ipi: "",
      pro: "ASCAP",
      role: "Lyricist",
      writerSplitPercent: 0,
      publisherName: "Self-Published",
      publisherIpi: "",
      publisherPro: "ASCAP",
      publisherSplitPercent: 0,
    };
    setFormWriters([...formWriters, newWriter]);
  };

  const handleUpdateWriter = (index: number, field: keyof SongWriter, value: any) => {
    const updated = [...formWriters];
    updated[index] = { ...updated[index], [field]: value };
    setFormWriters(updated);
  };

  const handleRemoveWriter = (index: number) => {
    setFormWriters(formWriters.filter((_, i) => i !== index));
  };

  const totalWriterSplit = formWriters.reduce((sum, w) => sum + (Number(w.writerSplitPercent) || 0), 0);

  const handleSaveSong = () => {
    if (!formTitle.trim()) {
      alert("Song title is required.");
      return;
    }

    const songPayload: SongMetadata = {
      id: editingSong?.id || `song_${Date.now()}`,
      title: formTitle.trim(),
      alternativeTitles: formAltTitles.split(",").map((s) => s.trim()).filter(Boolean),
      primaryArtist: formArtist.trim() || profile.artistName || "Independent Artist",
      featuredArtists: formFeatured.split(",").map((s) => s.trim()).filter(Boolean),
      isrc: formIsrc.trim().toUpperCase(),
      iswc: formIswc.trim().toUpperCase(),
      upc: formUpc.trim(),
      releaseDate: formReleaseDate,
      duration: formDuration.trim(),
      genre: formGenre.trim(),
      labelOrDistributor: formDistributor.trim(),
      pLine: formPLine.trim(),
      cLine: formCLine.trim(),
      explicit: formExplicit,
      writers: formWriters,
      streams: editingSong?.streams || [],
      totalEarnings: editingSong?.totalEarnings || 0,
      notes: formNotes.trim(),
      tags: editingSong?.tags || ["Master_Catalogue"],
      createdAt: editingSong?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isNewSong) {
      onAddSong(songPayload);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } else {
      onUpdateSong(songPayload);
    }

    setEditingSong(null);
  };

  return (
    <div id="catalogue-manager-view" className="space-y-6 animate-fadeIn">
      {/* Top Controls Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Song Catalog & Metadata Hub
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                  {songs.length} Tracks Registered
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your musical works, verified ISRCs, ISWCs, songwriter split percentages, and export to collection societies.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Track</span>
          </button>
        </div>

        {/* Search & Genre Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by song title, ISRC, artist, or co-writer..."
              className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Genres ({songs.length})</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Song List Cards */}
      {filteredSongs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredSongs.map((song) => {
            const writersTotal = (song.writers || []).reduce((sum, w) => sum + (w.writerSplitPercent || 0), 0);
            const isSplitValid = Math.abs(writersTotal - 100) < 0.1;

            return (
              <div
                key={song.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                {/* Left Song Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">{song.title}</h3>
                    {song.genre && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                        {song.genre}
                      </span>
                    )}
                    {isSplitValid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/30">
                        <CheckCircle className="w-2.5 h-2.5" /> Splits 100%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] border border-amber-500/30">
                        <AlertTriangle className="w-2.5 h-2.5" /> Splits {writersTotal}% (Needs Audit)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    Primary Artist: <strong className="text-slate-100">{song.primaryArtist}</strong>
                    {song.featuredArtists && song.featuredArtists.length > 0 && (
                      <span className="text-slate-400 font-normal"> (feat. {song.featuredArtists.join(", ")})</span>
                    )}
                  </p>

                  {/* Metadata Chips Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      ISRC: <strong className="text-indigo-300">{song.isrc || "Pending"}</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      ISWC: <strong className="text-slate-300">{song.iswc || "Pending"}</strong>
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Duration: {song.duration || "N/A"}
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Release: {song.releaseDate || "TBD"}
                    </span>
                  </div>

                  {/* Writers preview */}
                  <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span>
                      {(song.writers || []).map((w) => `${w.name} (${w.writerSplitPercent}%)`).join(" • ") || "Sole writer"}
                    </span>
                  </div>
                </div>

                {/* Right Actions & Quick Society Export */}
                <div className="flex flex-wrap md:flex-col items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenAssistantForSong?.(song)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border border-slate-700"
                      title="Ask Career Assistant to audit or generate marketing copy for this track"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Audit</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(song)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                      title="Edit song metadata"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete song '${song.title}' from catalogue?`)) {
                          onDeleteSong(song.id);
                        }
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg transition-colors border border-slate-700"
                      title="Delete song"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Platform Export Buttons */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => exportPlatformData("ASCAP", [song], profile)}
                      className="px-2 py-1 bg-slate-950 hover:bg-indigo-950 text-indigo-300 border border-slate-800 rounded font-mono"
                      title="Export ASCAP Work Registration CSV"
                    >
                      ASCAP
                    </button>
                    <button
                      onClick={() => exportPlatformData("MLC", [song], profile)}
                      className="px-2 py-1 bg-slate-950 hover:bg-amber-950 text-amber-300 border border-slate-800 rounded font-mono"
                      title="Export The MLC Mechanical Registration CSV"
                    >
                      MLC
                    </button>
                    <button
                      onClick={() => exportPlatformData("SOUNDEXCHANGE", [song], profile)}
                      className="px-2 py-1 bg-slate-950 hover:bg-emerald-950 text-emerald-300 border border-slate-800 rounded font-mono"
                      title="Export SoundExchange ISRC Recording CSV"
                    >
                      SoundEx
                    </button>
                    <button
                      onClick={() => exportPlatformData("SONGSPLIT", [song], profile)}
                      className="px-2 py-1 bg-slate-950 hover:bg-rose-950 text-rose-300 border border-slate-800 rounded font-mono"
                      title="Export Printable Split Agreement"
                    >
                      Split Sheet
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
          <Music className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No songs found in your catalogue.</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">
            Click 'Register New Track' or upload your distribution royalty screenshots to automatically extract ISRCs.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register First Track</span>
          </button>
        </div>
      )}

      {/* ADD / EDIT SONG MODAL */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 text-xs">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  {isNewSong ? "Register New Track & Songwriting Work" : `Edit Metadata: ${editingSong.title}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingSong(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Basic Track Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">1. Core Work & Sound Recording</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Song Title *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Midnight Horizon"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Alternative / Sub-Titles</label>
                    <input
                      type="text"
                      value={formAltTitles}
                      onChange={(e) => setFormAltTitles(e.target.value)}
                      placeholder="e.g. Midnight Horizon (Acoustic), Instrumental"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Primary Recording Artist</label>
                    <input
                      type="text"
                      value={formArtist}
                      onChange={(e) => setFormArtist(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Featured Artists (comma separated)</label>
                    <input
                      type="text"
                      value={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.value)}
                      placeholder="e.g. Maya Chen, Alex Rivers"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Standard Identifiers */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">2. Industry Identifiers (ISRC / ISWC / UPC)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">ISRC (Master Audio Code)</label>
                    <input
                      type="text"
                      value={formIsrc}
                      onChange={(e) => setFormIsrc(e.target.value)}
                      placeholder="e.g. US-S1Z-26-00001"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-300 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">ISWC (Composition Work Code)</label>
                    <input
                      type="text"
                      value={formIswc}
                      onChange={(e) => setFormIswc(e.target.value)}
                      placeholder="e.g. T-123456789-0"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">UPC / Barcode</label>
                    <input
                      type="text"
                      value={formUpc}
                      onChange={(e) => setFormUpc(e.target.value)}
                      placeholder="e.g. 198000123456"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Release Date</label>
                    <input
                      type="date"
                      value={formReleaseDate}
                      onChange={(e) => setFormReleaseDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Track Duration</label>
                    <input
                      type="text"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      placeholder="03:45"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Genre</label>
                    <input
                      type="text"
                      value={formGenre}
                      onChange={(e) => setFormGenre(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Songwriters & Split Percentages */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">3. Songwriters, Publishers & Split Allocations</h4>
                    <p className="text-[11px] text-slate-400">Must total exactly 100% for compliant MLC & ASCAP bulk filing.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        Math.abs(totalWriterSplit - 100) < 0.1
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      Total: {totalWriterSplit.toFixed(1)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleAddWriter}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded font-medium text-[11px] flex items-center gap-1 border border-slate-700"
                    >
                      <Plus className="w-3 h-3" /> Add Co-Writer
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formWriters.map((writer, index) => (
                    <div key={writer.id || index} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold">Writer Legal Name</label>
                          <input
                            type="text"
                            value={writer.name}
                            onChange={(e) => handleUpdateWriter(index, "name", e.target.value)}
                            placeholder="Full Legal Name"
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold">Role</label>
                          <select
                            value={writer.role}
                            onChange={(e) => handleUpdateWriter(index, "role", e.target.value as SongRole)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs"
                          >
                            <option value="Composer">Composer</option>
                            <option value="Lyricist">Lyricist</option>
                            <option value="Author">Author & Composer</option>
                            <option value="Producer">Producer / Beatmaker</option>
                            <option value="Arranger">Arranger</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-semibold">PRO & IPI #</label>
                          <div className="flex gap-1">
                            <select
                              value={writer.pro}
                              onChange={(e) => handleUpdateWriter(index, "pro", e.target.value)}
                              className="px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs w-20"
                            >
                              <option value="ASCAP">ASCAP</option>
                              <option value="BMI">BMI</option>
                              <option value="SESAC">SESAC</option>
                              <option value="PRS">PRS</option>
                              <option value="SOCAN">SOCAN</option>
                              <option value="Other">Other</option>
                            </select>
                            <input
                              type="text"
                              value={writer.ipi}
                              onChange={(e) => handleUpdateWriter(index, "ipi", e.target.value)}
                              placeholder="IPI #"
                              className="flex-1 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-400 uppercase font-semibold">Writer Share %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={writer.writerSplitPercent}
                              onChange={(e) => handleUpdateWriter(index, "writerSplitPercent", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-xs"
                            />
                          </div>
                          {formWriters.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveWriter(index)}
                              className="p-1 text-slate-500 hover:text-rose-400 self-end mb-0.5"
                              title="Remove writer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Publishing Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold">Publisher Entity</label>
                          <input
                            type="text"
                            value={writer.publisherName}
                            onChange={(e) => handleUpdateWriter(index, "publisherName", e.target.value)}
                            placeholder="e.g. Self-Published or Publishing Company"
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold">Publisher Share %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={writer.publisherSplitPercent}
                            onChange={(e) => handleUpdateWriter(index, "publisherSplitPercent", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Production Notes & Stem Details</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Master audio format (24-bit 48kHz), sample clearances, vocal mix details..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingSong(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSong}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Save Track Metadata</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
