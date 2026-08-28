import React, { useState, useEffect } from 'react';
import {
  Gavel,
  ShieldCheck,
  Disc3,
  Flame,
  Scale,
  Award,
  Sparkles,
  Heart,
  Volume2
} from 'lucide-react';
import { Header } from './components/Header';
import { JudgementChamber } from './components/JudgementChamber';
import { TrackSubmissionModal } from './components/TrackSubmissionModal';
import { ArtistDossierView } from './components/ArtistDossierView';
import { VaultPlaylistView } from './components/VaultPlaylistView';
import { SonicProfileView } from './components/SonicProfileView';
import { TermsModal } from './components/TermsModal';
import { JudgeTierModal } from './components/JudgeTierModal';
import { ArtistTrack, JudgeReview, SonicTasteProfile, UserJudgeProfile } from './types';
import { loadStoredProfile, loadStoredTracks, saveProfile, saveTracks } from './utils/storage';
import { calculateTierFromXp, recalculateTrackScores } from './utils/matchmaker';

export default function App() {
  const [tracks, setTracks] = useState<ArtistTrack[]>([]);
  const [userProfile, setUserProfile] = useState<UserJudgeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chamber' | 'submit' | 'dossier' | 'vault' | 'sonic'>('chamber');

  // Modals
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    let isMounted = true;
    Promise.all([loadStoredTracks(), loadStoredProfile()]).then(([loadedTracks, loadedProfile]) => {
      if (!isMounted) return;
      setTracks(loadedTracks);
      setUserProfile(loadedProfile);
      if (!loadedProfile.termsAccepted) setIsTermsOpen(true);
    }).catch((error) => {
      console.error('Failed to initialize Judgement Zone:', error);
    });
    return () => { isMounted = false; };
  }, []);

  // Save tracks when updated
  const handleUpdateTracks = (newTracks: ArtistTrack[]) => {
    setTracks(newTracks);
    saveTracks(newTracks);
  };

  // Save profile when updated
  const handleUpdateProfile = (newProfile: UserJudgeProfile) => {
    setUserProfile(newProfile);
    saveProfile(newProfile);
  };

  // Record a review from the Judgement Chamber
  const handleRecordReview = (review: JudgeReview, trackId: string, xpEarned: number) => {
    if (!userProfile) return;

    // 1. Update track reviews & recalculate aggregated scores
    const updatedTracks = tracks.map((t) => {
      if (t.id === trackId) {
        const newReviews = [...t.reviews, review];
        const newAggregated = recalculateTrackScores(newReviews);
        const isCompleted = newReviews.length >= 10;
        return {
          ...t,
          reviews: newReviews,
          aggregatedScores: newAggregated,
          status: (isCompleted ? 'completed' : 'evaluating') as 'completed' | 'evaluating'
        };
      }
      return t;
    });

    handleUpdateTracks(updatedTracks);

    // 2. Update user profile (XP, Audits completed, Tier progression, Daily quota)
    const newXp = userProfile.judgeXp + xpEarned;
    const tierInfo = calculateTierFromXp(newXp);
    const newAuditsTotal = userProfile.auditsCompletedTotal + 1;
    const newFullListens = userProfile.fullListensTotal + (review.completedFullListen ? 1 : 0);
    const newDailyRemaining = Math.max(0, userProfile.dailyAuditsRemaining - 1);

    // Count how many user submitted tracks are rated "Good" (>= 8.0/10)
    const goodSongsCount = updatedTracks.filter(
      (t) => userProfile.submittedTrackIds.includes(t.id) && t.aggregatedScores.overall >= 8.0
    ).length;

    const updatedProfile: UserJudgeProfile = {
      ...userProfile,
      judgeXp: newXp,
      judgeTier: tierInfo.tier,
      judgeTierLevel: tierInfo.level,
      auditsCompletedTotal: newAuditsTotal,
      fullListensTotal: newFullListens,
      dailyAuditsRemaining: newDailyRemaining,
      songsJudgedGoodCount: goodSongsCount,
      reputationScore: Math.min(100, Math.round(92 + (newFullListens / Math.max(1, newAuditsTotal)) * 8))
    };

    handleUpdateProfile(updatedProfile);
  };

  // Handle using a skip
  const handleUseSkip = () => {
    if (!userProfile || userProfile.skipsRemaining <= 0) return;
    const updatedProfile: UserJudgeProfile = {
      ...userProfile,
      skipsRemaining: userProfile.skipsRemaining - 1
    };
    handleUpdateProfile(updatedProfile);
  };

  // Save track to Vault
  const handleSaveToVault = (trackId: string) => {
    if (!userProfile) return;
    if (userProfile.savedVaultTrackIds.includes(trackId)) return;
    const updatedProfile: UserJudgeProfile = {
      ...userProfile,
      savedVaultTrackIds: [...userProfile.savedVaultTrackIds, trackId]
    };
    handleUpdateProfile(updatedProfile);
  };

  // Remove track from Vault
  const handleRemoveFromVault = (trackId: string) => {
    if (!userProfile) return;
    const updatedProfile: UserJudgeProfile = {
      ...userProfile,
      savedVaultTrackIds: userProfile.savedVaultTrackIds.filter((id) => id !== trackId)
    };
    handleUpdateProfile(updatedProfile);
  };

  // User submits a new track
  const handleTrackSubmitted = (newTrack: ArtistTrack) => {
    if (!userProfile) return;
    const updatedTracks = [newTrack, ...tracks];
    handleUpdateTracks(updatedTracks);

    const updatedProfile: UserJudgeProfile = {
      ...userProfile,
      submittedTrackIds: [newTrack.id, ...userProfile.submittedTrackIds]
    };
    handleUpdateProfile(updatedProfile);
  };

  // Update taste profile
  const handleUpdateTasteProfile = (newTaste: SonicTasteProfile) => {
    if (!userProfile) return;
    const updatedProfile: UserJudgeProfile = {
      ...userProfile,
      tasteProfile: newTaste
    };
    handleUpdateProfile(updatedProfile);
  };

  // Accept Terms of Service
  const handleAcceptTerms = () => {
    if (!userProfile) return;
    const updatedProfile: UserJudgeProfile = {
      ...userProfile,
      termsAccepted: true,
      termsAcceptedDate: new Date().toISOString()
    };
    handleUpdateProfile(updatedProfile);
    setIsTermsOpen(false);
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-xs text-amber-400">
          <Gavel className="w-5 h-5 animate-spin" />
          <span>Booting Judgement Zone Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-amber-950 font-sans">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userProfile={userProfile}
        onOpenTiers={() => setIsTierModalOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        queuedCount={tracks.filter((t) => !userProfile.savedVaultTrackIds.includes(t.id)).length}
      />

      {/* Main View Switcher */}
      <main className="flex-1">
        {activeTab === 'chamber' && (
          <JudgementChamber
            tracks={tracks}
            userProfile={userProfile}
            onRecordReview={handleRecordReview}
            onUseSkip={handleUseSkip}
            onSaveToVault={handleSaveToVault}
            onNavigateToSubmit={() => setActiveTab('submit')}
            onNavigateToSonicProfile={() => setActiveTab('sonic')}
          />
        )}

        {activeTab === 'submit' && (
          <TrackSubmissionModal
            onTrackSubmitted={handleTrackSubmitted}
            onNavigateToDossier={() => setActiveTab('dossier')}
          />
        )}

        {activeTab === 'dossier' && (
          <ArtistDossierView
            tracks={tracks}
            onUpdateTrack={(updated) => {
              const newTracks = tracks.map((t) => (t.id === updated.id ? updated : t));
              handleUpdateTracks(newTracks);
            }}
            onNavigateToSubmit={() => setActiveTab('submit')}
          />
        )}

        {activeTab === 'vault' && (
          <VaultPlaylistView
            tracks={tracks}
            savedTrackIds={userProfile.savedVaultTrackIds}
            onRemoveFromVault={handleRemoveFromVault}
            onNavigateToChamber={() => setActiveTab('chamber')}
          />
        )}

        {activeTab === 'sonic' && (
          <SonicProfileView
            userProfile={userProfile}
            onUpdateTasteProfile={handleUpdateTasteProfile}
            onNavigateToChamber={() => setActiveTab('chamber')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 mt-12 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-400">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                JZ
              </span>
              <span className="font-bold text-white uppercase tracking-wider">Judgement Zone</span>
            </div>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="font-mono text-zinc-400 text-[11px]">
              An IndieBrotherhood Production © 2026 • All Rights Reserved
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[11px]">
            <button
              onClick={() => setIsTermsOpen(true)}
              className="text-zinc-400 hover:text-amber-400 transition flex items-center gap-1"
            >
              <Scale className="w-3 h-3 text-amber-400" />
              <span>Terms of Service & Privacy</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsTierModalOpen(true)}
              className="text-zinc-400 hover:text-amber-400 transition flex items-center gap-1"
            >
              <Award className="w-3 h-3 text-amber-400" />
              <span>Judge Tiers & Multipliers</span>
            </button>
            <span>•</span>
            <span className="text-zinc-500">Unanimous Anonymous Consensus</span>
          </div>
        </div>
      </footer>

      {/* Terms & Privacy Modal */}
      <TermsModal
        isOpen={isTermsOpen}
        onAccept={handleAcceptTerms}
        onClose={() => setIsTermsOpen(false)}
        forceRequired={!userProfile.termsAccepted}
      />

      {/* Judge Tiers Modal */}
      <JudgeTierModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        userProfile={userProfile}
      />
    </div>
  );
}
