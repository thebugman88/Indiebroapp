import { createArtistCatalog } from '../services/artistCatalog';
import { authenticatedFetch } from '../services/authService';
import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Crown,
  Search,
  Music,
  Play,
  Pause,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Zap,
  Globe,
  Radio,
  Layers,
  Sliders,
  Award,
  Trophy,
  Plus,
  Trash2,
  Edit3,
  Save,
  KeyRound,
  Download,
  Upload,
  BarChart3,
  Clock,
  Disc,
  Headphones,
  RefreshCw,
  X,
  Volume2,
} from 'lucide-react';
import {
  RegisteredUser,
  CatalogTrack,
  VerifiedArtistInfo,
  STUDIO_AURAS,
  getCurrentAuthUser,
  saveCurrentAuthUser,
} from '../services/authService';
import { useGamification } from '../context/GamificationContext';

interface Props {
  currentUser: RegisteredUser;
  onUpdateUser: (user: RegisteredUser) => void;
  onOpenAuthModal: () => void;
  onNavigateToApp: (appId: string) => void;
}

export const ArtistProfilePage: React.FC<Props> = (props) => {
  const [session, setSession] = useState(() => ({ uid: getCurrentAuthUser().id, revision: 0 }));
  useEffect(() => {
    const sync = () => { const uid = getCurrentAuthUser().id; setSession(old => old.uid === uid ? old : { uid, revision: old.revision + 1 }); };
    window.addEventListener('ib_auth_changed', sync); sync();
    return () => window.removeEventListener('ib_auth_changed', sync);
  }, []);
  return <ArtistProfileWorkspace key={session.revision} {...props} uid={session.uid} />;
};
const ArtistProfileWorkspace: React.FC<Props & { uid: string }> = ({ uid,
  currentUser,
  onUpdateUser,
  onOpenAuthModal,
  onNavigateToApp,
}) => {
  const { profile, levelDetails, awardXP, updateProfile } = useGamification();
  const active = useRef(true);
  const isCurrent = () => active.current && getCurrentAuthUser().id === uid;
  useEffect(() => {
    active.current = true;
    const changed = () => { if (getCurrentAuthUser().id !== uid) active.current = false; };
    window.addEventListener('ib_auth_changed', changed);
    return () => { active.current = false; window.removeEventListener('ib_auth_changed', changed); };
  }, [uid]);
  const [vault] = useState(() => createArtistCatalog(uid, isCurrent, () => window.localStorage));
  const [initial] = useState(() => { try { return { data: vault.load(), error: '' }; } catch { return { data: { artist: null, tracks: [] }, error: 'Saved catalog could not be read. Reopen after checking browser storage; existing data has not been replaced.' }; } });
  const [catalogError, setCatalogError] = useState(initial.error);

  // Search Real-World Artist Identifier
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Catalog State
  const [verifiedArtist, setVerifiedArtist] = useState<VerifiedArtistInfo | null>(initial.data.artist);
  const [catalog, setCatalog] = useState<CatalogTrack[]>(initial.data.tracks);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Audio Preview Player
  const [playingTrackId, setPlayingTrackId] = useState<string | number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Profile Edit State
  const [isEditingEnv, setIsEditingEnv] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(currentUser.displayName);
  const [editHandle, setEditHandle] = useState(currentUser.artistHandle || '');
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editDaw, setEditDaw] = useState(currentUser.dawSetup || 'Ableton Live 12 Suite');
  const [editPro, setEditPro] = useState(currentUser.proAffiliation || 'ASCAP / Independent');
  const [editDistro, setEditDistro] = useState(currentUser.labelDistributor || 'indiebrotherhood Records');
  const [editIsrc, setEditIsrc] = useState(currentUser.isrcPrefix || 'US-IBH-2026');
  const [editAura, setEditAura] = useState<RegisteredUser['studioAura']>(currentUser.studioAura || 'gold');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser.avatarUrl || '');

  // Add Manual Track Modal
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newGenre, setNewGenre] = useState('Indie');
  const [newReleaseDate, setNewReleaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Tab state within profile
  const [activeTab, setActiveTab] = useState<'catalog' | 'environment' | 'gamify' | 'admin'>('catalog');

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  // Handle Search for Real-World Artist
  const handleSearchArtist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const resp = await authenticatedFetch(`/api/artist/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await resp.json();
      if (!isCurrent()) return;
      if (data.artists) {
        setSearchResults(data.artists);
      }
    } catch (err) {
      console.error('Artist search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Claim & Load Real-World Song Catalog
  const handleClaimArtistCatalog = async (artist: any) => {
    setIsLoadingCatalog(true);
    try {
      const url = `/api/artist/catalog?artistId=${encodeURIComponent(artist.artistId)}&artistName=${encodeURIComponent(artist.artistName)}`;
      const resp = await authenticatedFetch(url);
      const data = await resp.json();
      if (!isCurrent()) return;

      if (data.success && data.tracks) {
        const artistInfo: VerifiedArtistInfo = {
          artistId: artist.artistId,
          artistName: artist.artistName,
          primaryGenreName: artist.primaryGenreName,
          artworkUrl: artist.artworkUrl || data.artist?.artworkUrl,
          artistLinkUrl: artist.artistLinkUrl || data.artist?.artistLinkUrl,
          claimedAt: Date.now(),
          totalCatalogTracks: data.tracks.length,
        };

        vault.save(artistInfo, data.tracks);
        setVerifiedArtist(artistInfo);
        setCatalog(data.tracks);

        // Award XP for verifying real-world catalog
        awardXP({
          amount: 300,
          actionTitle: `Verified Real-World Catalog: ${artist.artistName} (${data.tracks.length} Songs)`,
          sourceApp: 'Artist Environment',
          badgeId: 'pipeline-perfect',
          badgeIncrement: 1,
        });

        // Update display name if user desires
        if (!currentUser.displayName || currentUser.displayName === 'Independent Creator') {
          const updatedUser = { ...currentUser, displayName: artist.artistName };
          onUpdateUser(updatedUser);
          saveCurrentAuthUser(updatedUser);
        }
      }
    } catch (err: any) {
      if (isCurrent()) setCatalogError(err.message || 'Catalog could not be saved.');
      console.error('Failed to load artist catalog:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Toggle Track Audio Preview
  const handleTogglePreview = (track: CatalogTrack) => {
    if (!track.previewUrl) return;

    if (playingTrackId === track.trackId) {
      audioElement?.pause();
      setPlayingTrackId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(track.previewUrl);
    audio.play().catch((e) => console.warn('Preview play prevented:', e));
    audio.onended = () => setPlayingTrackId(null);
    setAudioElement(audio);
    setPlayingTrackId(track.trackId);
  };

  // Save Environment Profile
  const handleSaveEnvironment = () => {
    const updatedUser: RegisteredUser = {
      ...currentUser,
      displayName: editDisplayName.trim() || currentUser.displayName,
      artistHandle: editHandle.trim() || currentUser.artistHandle,
      bio: editBio.trim(),
      dawSetup: editDaw,
      proAffiliation: editPro,
      labelDistributor: editDistro,
      isrcPrefix: editIsrc,
      studioAura: editAura,
      avatarUrl: editAvatarUrl.trim() || currentUser.avatarUrl,
    };

    onUpdateUser(updatedUser);
    saveCurrentAuthUser(updatedUser);
    updateProfile({
      displayName: updatedUser.displayName,
      artistHandle: updatedUser.artistHandle,
      avatarUrl: updatedUser.avatarUrl,
    });
    setIsEditingEnv(false);

    awardXP({
      amount: 150,
      actionTitle: 'Customized Artist Environment & Studio Setup',
      sourceApp: 'Artist Environment',
    });
  };

  // Add Manual Demo Track
  const handleAddManualTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    const newTrack: CatalogTrack = {
      trackId: `custom_${Date.now()}`,
      trackName: newTrackName.trim(),
      collectionName: newAlbumName.trim() || 'Unreleased Master Singles',
      artistName: verifiedArtist?.artistName || currentUser.displayName,
      releaseDate: newReleaseDate,
      trackTimeMillis: 195000,
      previewUrl: '',
      artworkUrl: verifiedArtist?.artworkUrl || currentUser.avatarUrl || '',
      primaryGenreName: newGenre,
      priceUsd: 'Unreleased',
      isrc: `${editIsrc}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    let updated: CatalogTrack[];
    try { updated = vault.add(newTrack); } catch (e: any) { setCatalogError(e.message); return; }
    setCatalog(updated);
    setIsAddTrackOpen(false);
    setNewTrackName('');
    setNewAlbumName('');

    awardXP({
      amount: 100,
      actionTitle: `Logged Unreleased Demo: ${newTrack.trackName}`,
      sourceApp: 'Artist Environment',
    });
  };

  // Current Aura styling
  const currentAuraConfig = STUDIO_AURAS.find((a) => a.id === currentUser.studioAura) || STUDIO_AURAS[0];

  // Catalog Metrics Calculation
  const totalCatalogSeconds = catalog.reduce((acc, t) => acc + (t.trackTimeMillis || 180000) / 1000, 0);
  const totalMinutes = Math.floor(totalCatalogSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const playtimeString = hours > 0 ? `${hours}h ${remainingMinutes}m` : `${totalMinutes} mins`;

  if (catalogError) return <p role="alert" className="p-6 text-red-300">{catalogError}</p>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Top Profile Header Canvas */}
      <div className="relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-8 pb-10 px-4 md:px-8">
        {/* Glow Accent */}
        <div
          className="absolute top-0 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: currentAuraConfig.hex }}
        />

        <div className="max-w-7xl mx-auto">
          {/* Main User Card Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar with dynamic Aura glow */}
              <div className="relative group">
                <div className={`h-24 w-24 md:h-28 md:w-28 rounded-3xl overflow-hidden ${currentAuraConfig.glowClass} transition-all duration-300`}>
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-tr ${currentUser.avatarBg || 'from-amber-500 to-rose-600'} flex items-center justify-center text-3xl font-black text-white select-none`}>
                      {currentUser.avatarSeed || currentUser.displayName?.slice(0, 2).toUpperCase() || 'IB'}
                    </div>
                  )}
                </div>
                {currentUser.isAdmin && (
                  <div className="absolute -top-2.5 -right-2.5 rounded-full bg-amber-400 p-1.5 shadow-lg border-2 border-slate-950 text-slate-950 font-black">
                    <Crown className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* User Bio & Meta */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                    {currentUser.displayName}
                  </h1>
                  {currentUser.isAdmin ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-black text-amber-300 border border-amber-500/40 shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                      FOUNDER & MASTER ADMIN
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold border ${currentAuraConfig.badgeClass}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                      {currentUser.role?.toUpperCase() || 'ARTIST'}
                    </span>
                  )}
                  {currentUser.isUnlimited && (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                      ⚡ Unlimited Access Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-3">
                  <span>@{currentUser.artistHandle || 'indiecreator'}</span>
                  <span>•</span>
                  <span>{currentUser.email}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{levelDetails.currentTier.title} (Level {levelDetails.currentTier.level})</span>
                </p>

                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {currentUser.bio || 'Independent recording artist, songwriter, and audio creator on indiebrotherhood.'}
                </p>
              </div>
            </div>

            {/* Quick Actions / Auth Switch */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                onClick={() => setIsEditingEnv(true)}
                className="flex-1 md:flex-initial rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-2"
              >
                <Edit3 className="h-4 w-4 text-amber-400" />
                Edit Studio Environment
              </button>
              <button
                onClick={onOpenAuthModal}
                className="flex-1 md:flex-initial rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                {currentUser.isAdmin ? 'Admin Credentials' : 'Switch User / Login'}
              </button>
            </div>
          </div>

          {/* Gamification Level & XP Snapshot Bar */}
          <div className="mt-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Creator XP</span>
              <span className="text-lg font-black text-amber-400">{profile.totalXp.toLocaleString()} XP</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Studio Level</span>
              <span className="text-lg font-black text-white">Tier {levelDetails.currentTier.level}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Streak</span>
              <span className="text-lg font-black text-rose-400">🔥 {profile.currentStreak} Days</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Badges Unlocked</span>
              <span className="text-lg font-black text-cyan-400">{profile.badges.filter(b => b.unlockedAt !== null).length} of {profile.badges.length}</span>
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Song Catalog</span>
              <span className="text-lg font-black text-emerald-400">{catalog.length} Released Tracks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Music className="h-4 w-4" />
            Real-World Identifier & Song Catalog ({catalog.length})
          </button>
          <button
            onClick={() => setActiveTab('environment')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'environment'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Studio Setup & Environment
          </button>
          <button
            onClick={() => setActiveTab('gamify')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'gamify'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Trophy className="h-4 w-4" />
            Quests & Creator Mastery
          </button>
          {currentUser.isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 shadow-md font-black'
                  : 'text-amber-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Crown className="h-4 w-4" />
              Master Admin Controls
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: REAL WORLD ARTIST IDENTIFIER & SONG CATALOG */}
      {activeTab === 'catalog' && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
          {/* SEARCH BAR SECTION */}
          <div className="rounded-3xl border border-amber-500/30 bg-slate-900/90 p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 mb-2">
                  <Globe className="h-3.5 w-3.5" />
                  GLOBAL INTERNET REGISTRY SEARCH
                </div>
                <h2 className="text-xl font-black text-white">Real-World Artist Identifier</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Type your real artist or band name to search all live music streaming databases. Click your artist name to pull and track your complete released song catalog right on your profile!
                </p>
              </div>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearchArtist} className="flex gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type artist name (e.g. Taylor Swift, Kendrick Lamar, Boygenius, or your indie alias)..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 font-bold text-slate-950 text-xs hover:from-amber-400 hover:to-amber-500 transition flex items-center gap-2 shadow-lg"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search Registry
              </button>
            </form>

            {/* Search Results Dropdown / Grid */}
            {searchResults.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Matching Artists Found ({searchResults.length}):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchResults.map((artist, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800 hover:border-amber-500/50 transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {artist.artworkUrl ? (
                          <img
                            src={artist.artworkUrl}
                            alt={artist.artistName}
                            className="h-12 w-12 rounded-xl object-cover border border-slate-800"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                            <Music className="h-5 w-5" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">
                            {artist.artistName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {artist.primaryGenreName} • {artist.source}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaimArtistCatalog(artist)}
                        disabled={isLoadingCatalog}
                        className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-400 transition shadow"
                      >
                        {isLoadingCatalog ? 'Loading...' : 'Claim & Track'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasSearched && searchResults.length === 0 && !isSearching && (
              <div className="mt-4 text-center py-6 text-slate-400 text-xs">
                No external streaming matches found for "{searchQuery}". You can track your music by clicking "Add Unreleased Demo" below!
              </div>
            )}
          </div>

          {/* VERIFIED ARTIST CATALOG DASHBOARD */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
            {/* Catalog Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Disc className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      {verifiedArtist ? `${verifiedArtist.artistName}'s Release Discography` : 'Active Song Catalog'}
                    </h2>
                    {verifiedArtist && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                        Verified Registry
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {catalog.length} Total Tracks • {playtimeString} Catalog Playtime • Real 30-Second Audio Previews
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsAddTrackOpen(true)}
                  className="flex-1 sm:flex-initial rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-400" />
                  Add Unreleased Demo
                </button>
                <button
                  onClick={() => onNavigateToApp('hit-analyzer')}
                  className="flex-1 sm:flex-initial rounded-xl bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 px-3.5 py-2 text-xs font-bold text-rose-300 transition flex items-center justify-center gap-1.5"
                >
                  <Flame className="h-3.5 w-3.5 text-rose-400" />
                  Audit in Hit Analyzer
                </button>
              </div>
            </div>

            {/* Catalog Table */}
            {catalog.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Music className="h-12 w-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Tracks in Catalog Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Use the search bar above to look up your real artist name or add your unreleased studio demos.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Track Title</th>
                      <th className="py-3 px-3">Album / Collection</th>
                      <th className="py-3 px-3">Genre</th>
                      <th className="py-3 px-3">Release</th>
                      <th className="py-3 px-3">ISRC Code</th>
                      <th className="py-3 px-3 text-right">Studio Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {catalog.map((track, idx) => {
                      const isPlaying = playingTrackId === track.trackId;
                      const mins = Math.floor((track.trackTimeMillis || 180000) / 60000);
                      const secs = Math.floor(((track.trackTimeMillis || 180000) % 60000) / 1000);
                      const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                      return (
                        <tr key={idx} className="hover:bg-slate-950/60 transition group">
                          {/* Play Preview Button */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {track.previewUrl ? (
                              <button
                                onClick={() => handleTogglePreview(track)}
                                className={`h-8 w-8 rounded-full flex items-center justify-center transition shadow ${
                                  isPlaying
                                    ? 'bg-amber-400 text-slate-950 animate-pulse'
                                    : 'bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950'
                                }`}
                                title={isPlaying ? 'Pause Preview' : 'Play 30s Preview'}
                              >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                              </button>
                            ) : (
                              <span className="text-slate-600 text-[11px] font-mono">{idx + 1}</span>
                            )}
                          </td>

                          {/* Track Title */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              {track.artworkUrl && (
                                <img
                                  src={track.artworkUrl}
                                  alt={track.trackName}
                                  className="h-9 w-9 rounded-lg object-cover border border-slate-800 shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-bold text-white group-hover:text-amber-300 transition">
                                  {track.trackName}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {track.artistName} • {timeStr}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Collection / Album */}
                          <td className="py-3 px-3 text-slate-300">{track.collectionName || 'Single'}</td>

                          {/* Genre */}
                          <td className="py-3 px-3">
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                              {track.primaryGenreName}
                            </span>
                          </td>

                          {/* Release Date */}
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{track.releaseDate}</td>

                          {/* ISRC */}
                          <td className="py-3 px-3 font-mono text-[11px] text-cyan-400">{track.isrc || 'US-IBH-AUTO'}</td>

                          {/* Studio Action Shortcuts */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onNavigateToApp('lyric-pro')}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition"
                                title="Open in Lyric Pro Studio"
                              >
                                <Zap className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onNavigateToApp('royaltyops')}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition"
                                title="Process in RoyaltyOps"
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </button>
                              {track.trackViewUrl && (
                                <a
                                  href={track.trackViewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                  title="View on Streaming Store"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STUDIO ENVIRONMENT & SETUP */}
      {activeTab === 'environment' && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 md:p-8">
            <h2 className="text-xl font-black text-white mb-1">Artist Studio Environment & Metadata</h2>
            <p className="text-xs text-slate-400 mb-6">
              Configure your primary production workstation, PRO registrations, aura color, and release distribution details.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary DAW */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Primary Digital Audio Workstation (DAW)</label>
                <select
                  value={editDaw}
                  onChange={(e) => setEditDaw(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Ableton Live 12 Suite & Hardware">Ableton Live 12 Suite</option>
                  <option value="FL Studio 21 Signature Edition">FL Studio 21</option>
                  <option value="Apple Logic Pro X">Apple Logic Pro X</option>
                  <option value="Avid Pro Tools Ultimate">Avid Pro Tools Ultimate</option>
                  <option value="PreSonus Studio One 6">PreSonus Studio One 6</option>
                  <option value="Cockos Reaper">Cockos Reaper</option>
                  <option value="Akai MPC Standalone & Hardware">Akai MPC Standalone</option>
                </select>
              </div>

              {/* PRO Affiliation */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Performing Rights Organization (PRO)</label>
                <select
                  value={editPro}
                  onChange={(e) => setEditPro(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="ASCAP (United States)">ASCAP (United States)</option>
                  <option value="BMI (United States)">BMI (United States)</option>
                  <option value="SESAC (United States)">SESAC (United States)</option>
                  <option value="PRS for Music (United Kingdom)">PRS for Music (United Kingdom)</option>
                  <option value="SOCAN (Canada)">SOCAN (Canada)</option>
                  <option value="GEMA (Germany)">GEMA (Germany)</option>
                  <option value="SACEM (France)">SACEM (France)</option>
                  <option value="Independent / Self-Administered">Independent / Self-Administered</option>
                </select>
              </div>

              {/* Label / Distributor */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Primary Distributor / Record Label</label>
                <input
                  type="text"
                  value={editDistro}
                  onChange={(e) => setEditDistro(e.target.value)}
                  placeholder="e.g. DistroKid, TuneCore, AWAL, indiebrotherhood Records"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* ISRC Prefix */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Default ISRC Master Prefix</label>
                <input
                  type="text"
                  value={editIsrc}
                  onChange={(e) => setEditIsrc(e.target.value)}
                  placeholder="e.g. US-IBH-2026"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-cyan-300 font-mono placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Custom Avatar URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Custom Profile Picture Image URL</label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://... direct image link or leave blank for dynamic initials"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Studio Aura Selector */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Studio Atmosphere & Ambient Aura Glow
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {STUDIO_AURAS.map((aura) => (
                    <button
                      key={aura.id}
                      type="button"
                      onClick={() => setEditAura(aura.id)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        editAura === aura.id
                          ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="h-6 w-6 rounded-full shadow-inner"
                        style={{ backgroundColor: aura.hex }}
                      />
                      <span className="text-[11px] font-bold text-white">{aura.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleSaveEnvironment}
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-3 text-xs font-black text-slate-950 shadow-lg hover:opacity-95 transition flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Studio Environment Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GAMIFICATION & QUESTS */}
      {activeTab === 'gamify' && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Quests List */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Daily Creator Quests</h3>
              </div>
              <div className="space-y-3">
                {profile.dailyQuests.map((quest) => (
                  <div key={quest.id} className="rounded-2xl bg-slate-950 p-4 border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white">{quest.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{quest.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${Math.min(100, (quest.progress / quest.maxProgress) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {quest.progress}/{quest.maxProgress}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-amber-400 block">+{quest.xpReward} XP</span>
                      <button
                        onClick={() => onNavigateToApp(quest.targetApp)}
                        className="mt-1.5 rounded-xl bg-slate-800 px-3 py-1 text-[10px] font-bold text-slate-200 hover:bg-amber-500 hover:text-slate-950 transition"
                      >
                        Launch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Preview */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Studio Badges</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {profile.badges.slice(0, 6).map((badge) => (
                  <div
                    key={badge.id}
                    className={`rounded-2xl p-3 border text-center ${
                      badge.unlockedAt !== null
                        ? 'bg-slate-950 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-60 text-slate-500'
                    }`}
                  >
                    <span className="text-lg block">🏆</span>
                    <span className="text-[11px] font-bold block truncate mt-1">{badge.name}</span>
                    <span className="text-[9px] text-slate-400 block">{badge.tier} Tier</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MASTER ADMIN CONTROLS (ADMIN ONLY) */}
      {activeTab === 'admin' && currentUser.isAdmin && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-6">
          <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Founder Master Command Deck</h2>
                <p className="text-xs text-amber-200/90">Unlimited applet authority and studio ecosystem overrides.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Max Level 10 Button */}
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-white">Instant Level 10 Icon</h3>
                <p className="text-[11px] text-slate-400">Instantly grant +25,000 XP to max out level perks and badges.</p>
                <button
                  onClick={() => {
                    awardXP({ amount: 25000, actionTitle: 'Master Admin Override: Max Level 10 Granted', sourceApp: 'Admin Deck' });
                  }}
                  className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  ⚡ Grant Max XP
                </button>
              </div>

              {/* Unlimited Passkey Info */}
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-white">Account recovery</h3>
                <p className="text-[11px] text-slate-400">Use the sign-in dialog to request a password reset email.</p>
                <div className="rounded-xl bg-slate-900 px-3 py-1.5 font-mono text-xs font-bold text-cyan-300 border border-slate-800">
                  {'Use email password recovery'}
                </div>
              </div>

              {/* Export Backup JSON */}
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-white">Export Studio State (JSON)</h3>
                <p className="text-[11px] text-slate-400">Download complete catalog, profile, and XP audit logs.</p>
                <button
                  onClick={() => {
                    if (!isCurrent()) return;
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ user: currentUser, catalog, profile }, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `indiebrotherhood_backup_${Date.now()}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="w-full rounded-xl bg-slate-800 py-2 text-xs font-bold text-white hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  Download Backup JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD UNRELEASED DEMO MODAL */}
      {isAddTrackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-950 p-6 shadow-2xl">
            <button
              onClick={() => setIsAddTrackOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-black text-white mb-1">Add Unreleased Demo to Catalog</h3>
            <p className="text-xs text-slate-400 mb-4">Track unreleased studio stems alongside your live release catalog.</p>

            <form onSubmit={handleAddManualTrack} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Song / Demo Title *</label>
                <input
                  type="text"
                  value={newTrackName}
                  onChange={(e) => setNewTrackName(e.target.value)}
                  placeholder="e.g. Midnight Velocity (Master Demo)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Project / EP Title</label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="e.g. 2026 Studio Singles"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Genre</label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    placeholder="e.g. Hip-Hop, Indie"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Date Created</label>
                  <input
                    type="date"
                    value={newReleaseDate}
                    onChange={(e) => setNewReleaseDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-500 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition mt-2"
              >
                Log Demo into Verified Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
