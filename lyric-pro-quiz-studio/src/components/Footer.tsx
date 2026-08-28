import React from 'react';
import { ShieldCheck, Award, Zap, Lock, Radio, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-black/60 border-t border-white/10 mt-16 pt-10 pb-8 px-6 backdrop-blur-md z-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Brand Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#08080d] rounded-[10px] flex items-center justify-center">
                <Radio className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-white uppercase font-sans">
                SONIC <span className="text-purple-400">IQ LAB</span>
              </span>
              <p className="text-[11px] text-gray-400">
                Engineered by <span className="text-purple-300 font-bold">indiebrotherhood</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full">
            <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Sonic IQ Audio Processing Unit Active</span>
          </div>
        </div>

        {/* Quality Badges Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white block uppercase tracking-wide">
                SONIC IQ LAB
              </span>
              <span className="text-[9px] text-gray-400">EST. 2026</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white block uppercase tracking-wide">
                MUSICOLOGY ENGINE
              </span>
              <span className="text-[9px] text-gray-400">100% VERIFIED</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white block uppercase tracking-wide">
                ANTI-CHEAT TIMERS
              </span>
              <span className="text-[9px] text-gray-400">LIVE PREVENT</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-white block uppercase tracking-wide">
                IMMUNITY ACTIVE
              </span>
              <span className="text-[9px] text-gray-400">PRO VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Exact Required Copyright Line */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6 text-[10px] tracking-widest text-gray-400 uppercase font-medium">
          <div>
            &copy; 2026 indiebrotherhood all rights reserved
          </div>

          <div className="flex items-center gap-4 text-[10px] text-gray-400">
            <span>Sonic IQ Lab Protocols</span>
            <span>•</span>
            <span>Engineered by indiebrotherhood</span>
            <span>•</span>
            <span>Version 2.4 Pro</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

