import React, { useState } from 'react';
import { ExternalLink, Sparkles, Tv, CheckCircle2, X, Zap, DollarSign } from 'lucide-react';

interface SponsoredAdBannerProps {
  onEarnReward?: (bonusPoints: number) => void;
  variant?: 'banner' | 'card' | 'reward_cta';
}

export const SponsoredAdBanner: React.FC<SponsoredAdBannerProps> = ({
  onEarnReward,
  variant = 'banner',
}) => {
  const [showAdModal, setShowAdModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const handleStartWatchAd = () => {
    setIsWatchingAd(true);
    setAdProgress(0);

    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsWatchingAd(false);
          setRewardClaimed(true);
          if (onEarnReward) onEarnReward(500);
          return 100;
        }
        return prev + 20;
      });
    }, 600);
  };

  if (variant === 'reward_cta') {
    return (
      <>
        <div className="bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300">
              <Tv className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                SPONSORED REWARD
              </span>
              <p className="text-xs font-bold text-white">
                Watch 5s Sponsored Clip for +500 Bonus Points!
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider transition-transform active:scale-95 cursor-pointer shrink-0 shadow-md flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>EARN +500 PTS</span>
          </button>
        </div>

        {/* Ad Video Simulation Modal */}
        {showAdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-md bg-[#0e0e16] border border-white/10 rounded-[32px] p-6 text-center space-y-5 shadow-2xl">
              <button
                onClick={() => setShowAdModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase border border-purple-500/30">
                <DollarSign className="w-3.5 h-3.5" />
                <span>SPONSORED REWARDED AD</span>
              </div>

              {!rewardClaimed ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-white">Sonic Audio Gear Pro</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      "Experience studio-grade active noise cancellation and 40-hour wireless audio playback. Designed for producers and music aficionados."
                    </p>
                  </div>

                  {/* Video Screen Simulation */}
                  <div className="bg-black/60 border border-white/10 rounded-2xl h-44 flex flex-col items-center justify-center relative overflow-hidden p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-xl" />
                    <Tv className="w-10 h-10 text-purple-400 animate-pulse relative z-10 mb-2" />
                    <p className="text-xs text-gray-300 relative z-10 font-medium">
                      {isWatchingAd ? `Playing Sponsored Clip... ${adProgress}%` : 'Click below to launch 5s clip'}
                    </p>

                    {/* Progress Bar */}
                    {isWatchingAd && (
                      <div className="w-full bg-white/10 rounded-full h-2 mt-4 relative z-10 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                          style={{ width: `${adProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleStartWatchAd}
                    disabled={isWatchingAd}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>{isWatchingAd ? 'WATCHING...' : 'WATCH AD & CLAIM +500 PTS'}</span>
                  </button>
                </>
              ) : (
                <div className="py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-white">REWARD CLAIMED!</h3>
                  <p className="text-xs text-emerald-400 font-bold">+500 Bonus Points added to your Vault!</p>
                  <button
                    onClick={() => {
                      setShowAdModal(false);
                      setRewardClaimed(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                  >
                    CLOSE & CONTINUE QUIZ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Standard Banner Ad Placement
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md relative overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
          SPONSORED AD
        </span>
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            Sonic Studio Pro Headphone Line <ExternalLink className="w-3 h-3 text-gray-400" />
          </h4>
          <p className="text-[11px] text-gray-400">
            Engineered for audiophiles. 40-hour battery, zero-latency wireless.
          </p>
        </div>
      </div>

      <a
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer whitespace-nowrap disabled-link"
        onClick={(e) => e.preventDefault()}
        title="Placeholder ad - connect to real ad network or remove"
      >
        LEARN MORE
      </a>
    </div>
  );
};
