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

  // Check URL for stripe payment redirect params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      // Verify session with server
      fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.valid || data.isSimulated) {
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

  const cancelPro = useCallback(() => {
    const updated = cancelProSubscription();
    setProfile(updated);
  }, []);

  const startStripeCheckout = useCallback(async (returnUrl?: string) => {
    try {
      const clientKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `ib_idemp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: '',
          userId: `usr_${profile.displayName.toLowerCase().replace(/\s+/g, '_')}`,
          clientCustomKey: clientKey,
          returnUrl: returnUrl || window.location.href.split('?')[0]
        })
      });

      const data = await res.json();
      if (data.url) {
        // Redirect to real Stripe checkout
        window.location.href = data.url;
        return { success: true, url: data.url, isSimulated: false };
      } else if (data.isSimulated) {
        // Instant simulated Pro activation
        activatePro(data.subscription?.currentPeriodEnd);
        awardXP({
          amount: 250,
          actionTitle: 'Activated Artist Pro Powerhouse Pass',
          sourceApp: 'Pro Checkout'
        });
        return { success: true, isSimulated: true };
      } else if (data.error) {
        return { success: false, error: data.error };
      }
      return { success: true, isSimulated: true };
    } catch (err: any) {
      console.error('Error starting Stripe checkout:', err);
      // Fallback to local simulation if offline or error
      activatePro();
      return { success: true, isSimulated: true };
    }
  }, [profile.displayName, activatePro, awardXP]);

  const verifyCheckoutSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      return data;
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
