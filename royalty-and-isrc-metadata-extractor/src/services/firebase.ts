/**
 * Firebase Cloud Sync & Authentication Module
 * Provides optional Firestore cloud synchronization and Google Cloud deployment support
 * while preserving 100% offline-first functionality in IndexedDB.
 */

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Load default Firebase configuration from Vite environment variables if available
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
};

export function isFirebaseConfigured(config: FirebaseConfig = DEFAULT_FIREBASE_CONFIG): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

/**
 * Cloud Sync State Tracker
 */
export interface SyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
}

export function getInitialSyncStatus(): SyncStatus {
  return {
    isConfigured: isFirebaseConfigured(),
    isConnected: false,
    lastSyncedAt: null,
    syncError: null,
  };
}
