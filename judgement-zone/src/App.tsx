import { getCurrentAuthUser } from '../../src/services/authService';
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
import { loadStoredProfile, loadStoredTracks, saveProfile, submitTrack, submitReview, useSkip } from './utils/storage';
import { calculateTierFromXp, recalculateTrackScores } from './utils/matchmaker';

export default function App() {
  const [session, setSession] = useState(() => ({ uid: getCurrentAuthUser().id, revision: 0 }));
  useEffect(() => {
    const sync = () => { const uid = getCurrentAuthUser().id; setSession(old => old.uid === uid ? old : { uid, revision: old.revision + 1 }); };
    window.addEventListener('ib_auth_changed', sync); sync();
    return () => window.removeEventListener('ib_auth_changed', sync);
  }, []);
  // Late review/profile responses can only update the unmounted old workspace.
  return <JudgementWorkspace key={session.revision} />;
}
function JudgementWorkspace() {
  const [tracks, setTracks] = useState<ArtistTrack[]>([]);
  const [userProfile, setUserProfile] = useState<UserJudgeProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chamber' | 'submit' | 'dossier' | 'vault' | 'sonic'>('chamber');

  const [error,setError]=useState('');
  // Modals
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  useEffect(() => {
    let version=0;
    const refresh=()=>{const request=++version;setUserProfile(null);setTracks([]);setError('');
      Promise.all([loadStoredTracks(),loadStoredProfile()]).then(([list,profile])=>{if(request!==version)return;setTracks(list);setUserProfile(profile);setIsTermsOpen(!profile.termsAccepted);}).catch(e=>{if(request===version)setError(e.message);});
    };
    refresh();window.addEventListener('ib_auth_changed',refresh);
    return()=>{version++;window.removeEventListener('ib_auth_changed',refresh);};
  }, []);

  const handleUpdateProfile = async (newProfile:UserJudgeProfile) => {
    try { setUserProfile(await saveProfile(newProfile));setError(''); } catch(e:any) {setError(e.message);}
  };
  const handleRecordReview = async (review:JudgeReview,trackId:string,_xp:number) => {
    const result=await submitReview(trackId,review);
    setTracks(old=>old.map(t=>t.id===trackId?result.track:t));setUserProfile(result.profile);
    return result.review;
  };
  const handleUseSkip = async () => {setUserProfile(await useSkip());};

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

  const handleTrackSubmitted = async (newTrack:ArtistTrack,file:File) => {
    const track=await submitTrack(newTrack,file);setTracks(old=>[track,...old]);setUserProfile(await loadStoredProfile());return track;
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
          <span>{error || 'Loading Judgement Zone…'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-amber-950 font-sans">
      {error && <p role="alert" className="p-4 text-amber-300">{error}</p>}
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
            tracks={tracks.filter(t=>t.ownerId===userProfile.id)}
            onUpdateTrack={() => setError('Submitted tracks cannot be overwritten.')}
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
