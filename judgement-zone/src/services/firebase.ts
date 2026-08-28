import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, User } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    setDoc,
    writeBatch
} from 'firebase/firestore';
import { ArtistTrack, UserJudgeProfile } from '../types';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export async function getFirebaseUser(): Promise<User | null> {
    if (!auth) return null;
    if (auth.currentUser) return auth.currentUser;
    const result = await signInAnonymously(auth);
    return result.user;
}

export async function loadRemoteTracks(): Promise<ArtistTrack[] | null> {
    if (!db) return null;
    const snapshot = await getDocs(collection(db, 'tracks'));
    return snapshot.docs.map((item) => item.data() as ArtistTrack);
}

export async function saveRemoteTracks(tracks: ArtistTrack[]): Promise<void> {
    if (!db) return;
    const batch = writeBatch(db);
    tracks.forEach((track) => batch.set(doc(db!, 'tracks', track.id), track));
    await batch.commit();
}

export async function loadRemoteProfile(userId: string): Promise<UserJudgeProfile | null> {
    if (!db) return null;
    const snapshot = await getDoc(doc(db, 'userProfiles', userId));
    return snapshot.exists() ? (snapshot.data() as UserJudgeProfile) : null;
}

export async function saveRemoteProfile(profile: UserJudgeProfile): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, 'userProfiles', profile.id), profile, { merge: true });
}
