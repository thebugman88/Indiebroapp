import { requestPurchase } from '../components/PurchaseDialog';
import { authenticatedFetch } from '../services/authService';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserProfileState,
  loadProfileState,
  saveProfileState,
  grantUserXP,
  GrantXpOptions,
  GrantXpResult,
  getLevelDetails,
  LevelInfo,
  Badge,
  DailyQuest,
  getInitials,
  activateProSubscription,
  cancelProSubscription
} from '../services/gamification';

interface GamificationContextType {
  profile: UserProfileState;
  levelDetails: {
    currentTier: LevelInfo;
    nextTier: LevelInfo | null;
    progressPct: number;
    xpInLevel: number;
    xpRequiredForLevel: number;
  };
  awardXP: (options: GrantXpOptions) => GrantXpResult;
  updateProfile: (updates: Partial<UserProfileState>) => void;
  updateProfileName: (name: string) => void;
  updateAvatar: (avatarSeed: string, bgGradient: string, avatarType?: 'initials' | 'preset' | 'url', avatarUrl?: string) => void;
  claimQuestReward: (questId: string) => void;
  completeDailyPipeline: () => void;
  resetProgress: () => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  activatePro: (expiresAt?: number, customerId?: string) => void;
  cancelPro: () => void;
  startStripeCheckout: (returnUrl?: string) => Promise<{ success: boolean; url?: string; isSimulated?: boolean; error?: string }>;
  verifyCheckoutSession: (sessionId: string) => Promise<{ valid: boolean; tier: string; isSimulated?: boolean }>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfileState>(loadProfileState());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Synchronize on window focus or custom events
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfileState>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        setProfile(loadProfileState());
      }
    };

    window.addEventListener('ib_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('ib_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  // Subscription storage is a display cache only. Revalidate for each signed-in account.
  useEffect(() => {
    let revision = 0;
    const refresh = async () => {
      const request = ++revision;
      setProfile(cancelProSubscription());
      try {
        const response = await authenticatedFetch('/api/stripe/subscription');
        const status = await response.json();
        if (request === revision && response.ok && status.valid === true && status.expiresAt > Date.now()) {
          setProfile(activateProSubscription(status.expiresAt));
        }
      } catch { /* No trusted status means free access. */ }
    };
    void refresh();
    window.addEventListener('ib_auth_changed', refresh);
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { revision++; clearInterval(timer); window.removeEventListener('ib_auth_changed', refresh); window.removeEventListener('focus', refresh); };
  }, []);

  // Check URL for stripe payment redirect params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      // Verify session with server
      authenticatedFetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.valid === true && data.tier === 'pro') {
            const updated = activateProSubscription(data.expiresAt, data.customerId);
            setProfile(updated);
            awardXP({
              amount: 500,
              actionTitle: 'Activated Artist Pro Powerhouse ($4.99/mo)',
              sourceApp: 'Stripe Checkout',
              badgeId: 'pipeline-perfect',
              badgeIncrement: 1
            });
            // Clean up query string without page reload
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        })
        .catch((err) => {
          console.error('Error verifying Stripe checkout session:', err);
        });
    }
  }, []);

  const levelDetails = getLevelDetails(profile.totalXp);

  const awardXP = useCallback((options: GrantXpOptions): GrantXpResult => {
    const res = grantUserXP(options);
    setProfile(loadProfileState());
    return res;
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfileState>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      if (updates.displayName && (!updates.avatarSeed || updates.avatarType === 'initials')) {
        next.avatarSeed = getInitials(updates.displayName);
      }
      saveProfileState(next);
      return next;
    });
  }, []);

  const updateProfileName = useCallback((name: string) => {
    const trimmed = name.trim() || 'Independent Creator';
    updateProfile({
      displayName: trimmed,
      avatarSeed: getInitials(trimmed)
    });
  }, [updateProfile]);

  const updateAvatar = useCallback((
    avatarSeed: string,
    bgGradient: string,
    avatarType: 'initials' | 'preset' | 'url' = 'preset',
    avatarUrl?: string
  ) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        avatarSeed,
        avatarBg: bgGradient,
        avatarType,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : prev.avatarUrl
      };
      saveProfileState(next);
      return next;
    });
  }, []);

  const activatePro = useCallback((expiresAt?: number, customerId?: string) => {
    const updated = activateProSubscription(expiresAt, customerId);
    setProfile(updated);
  }, []);

  const cancelPro = useCallback(() => { void authenticatedFetch('/api/stripe/cancel', { method: 'POST' }).then(async r => { const data = await r.json(); window.alert(data.message || data.error || 'Cancellation not confirmed.'); }).catch(() => window.alert('Cancellation not confirmed. Please retry.')); }, []);

  const startStripeCheckout = useCallback(async (_returnUrl?: string) => { requestPurchase('pro'); return { success: true }; }, []);

  const verifyCheckoutSession = useCallback(async (sessionId: string) => {
    try {
      const res = await authenticatedFetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      return res.ok && data.valid === true ? data : { valid: false, tier: 'free' };
    } catch (err) {
      return { valid: false, tier: 'free' };
    }
  }, []);

  const claimQuestReward = useCallback((questId: string) => {
    setProfile((prev) => {
      const targetQuest = prev.dailyQuests.find((q) => q.id === questId);
      if (!targetQuest || !targetQuest.completed || targetQuest.claimed) return prev;

      targetQuest.claimed = true;
      grantUserXP({
        amount: targetQuest.xpReward,
        actionTitle: `Daily Quest Completed: ${targetQuest.title}`,
        sourceApp: 'Daily Quests'
      });

      return loadProfileState();
    });
  }, []);

  const completeDailyPipeline = useCallback(() => {
    setProfile((prev) => {
      if (prev.pipelineCompletedToday) return prev;

      grantUserXP({
        amount: 150,
        actionTitle: 'Complete 4-Step Production Pipeline Bonus',
        sourceApp: 'Suite Hub',
        badgeId: 'pipeline-perfect',
        badgeIncrement: 1
      });

      const updated = loadProfileState();
      updated.pipelineCompletedToday = true;
      saveProfileState(updated);
      return updated;
    });
  }, []);

  const resetProgress = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ib_gamification_profile_v2');
      const fresh = loadProfileState();
      setProfile(fresh);
    }
  }, []);

  return (
    <GamificationContext.Provider
      value={{
        profile,
        levelDetails,
        awardXP,
        updateProfile,
        updateProfileName,
        updateAvatar,
        claimQuestReward,
        completeDailyPipeline,
        resetProgress,
        isProfileModalOpen,
        setIsProfileModalOpen,
        activatePro,
        cancelPro,
        startStripeCheckout,
        verifyCheckoutSession
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
