import { ArtistTrack, SonicTasteProfile, UserJudgeProfile } from '../types';
import { checkAndRefreshDailyCycle } from './matchmaker';
import {
  getFirebaseUser,
  isFirebaseConfigured,
  loadRemoteProfile,
  loadRemoteTracks,
  saveRemoteProfile,
  saveRemoteTracks
} from '../services/firebase';

const STORAGE_KEYS = {
  TRACKS: 'judgement_zone_tracks_v1',
  PROFILE: 'judgement_zone_user_profile_v1',
  TERMS: 'judgement_zone_terms_agreed_v1'
};

const DEFAULT_TASTE_PROFILE: SonicTasteProfile = {
  preferredGenres: ['Hip-Hop / BoomBap', 'R&B / Neo-Soul', 'Trap / Drill', 'Synthwave / Retro'],
  preferredMoods: ['Introspective', 'Energetic', 'Sensual', 'Cinematic'],
  productionFocus: ['beat_production', 'lyrics', 'vocals'],
  tempoPreference: 'all'
};

const DEFAULT_PROFILE: UserJudgeProfile = {
  id: 'local-judge',
  name: 'New Judge',
  judgeTier: 'Apprentice Ear',
  judgeTierLevel: 1,
  judgeXp: 0,
  reputationScore: 0,
  auditsCompletedTotal: 0,
  fullListensTotal: 0,
  skipsRemaining: 3,
  dailyAuditsRemaining: 18,
  dailyAuditsMax: 20,
  lastCycleTimestamp: Date.now(),
  tasteProfile: DEFAULT_TASTE_PROFILE,
  savedVaultTrackIds: [],
  submittedTrackIds: [],
  songsJudgedGoodCount: 0,
  termsAccepted: false
};

export async function loadStoredTracks(): Promise<ArtistTrack[]> {
  if (isFirebaseConfigured) {
    try {
      const remoteTracks = await loadRemoteTracks();
      if (remoteTracks) return remoteTracks;
    } catch (error) {
      console.error('Firebase tracks unavailable; using local storage:', error);
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRACKS);
    if (raw) {
      const parsed: ArtistTrack[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load stored tracks:', e);
  }
  return [];
}

export async function saveTracks(tracks: ArtistTrack[]): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await saveRemoteTracks(tracks);
      return;
    } catch (error) {
      console.error('Failed to save tracks to Firebase; using local storage:', error);
    }
  }
  try {
    localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
  } catch (e) {
    console.error('Failed to save tracks:', e);
  }
}

export async function loadStoredProfile(): Promise<UserJudgeProfile> {
  let firebaseUser = null;
  try {
    firebaseUser = await getFirebaseUser();
  } catch (error) {
    console.error('Firebase authentication unavailable; using local storage:', error);
  }
  if (firebaseUser) {
    const remoteProfile = await loadRemoteProfile(firebaseUser.uid);
    if (remoteProfile) return checkAndRefreshDailyCycle(remoteProfile);
    const profile = { ...DEFAULT_PROFILE, id: firebaseUser.uid };
    await saveRemoteProfile(profile);
    return profile;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed: UserJudgeProfile = JSON.parse(raw);
      // Run 24h daily quota refresh check
      const refreshed = checkAndRefreshDailyCycle(parsed);
      return refreshed;
    }
  } catch (e) {
    console.error('Failed to load user profile:', e);
  }
  saveProfile(DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

export async function saveProfile(profile: UserJudgeProfile): Promise<void> {
  if (isFirebaseConfigured) {
    await saveRemoteProfile(profile);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}
