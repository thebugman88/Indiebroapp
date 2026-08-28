import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Lock,
  Mail,
  User,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Crown,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  RegisteredUser,
  ADMIN_EMAIL,
  SECURITY_QUESTIONS,
  loginAsMasterAdmin,
  loginUser,
  registerUser,
  recoverAccount,
} from '../services/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: RegisteredUser) => void;
  initialTab?: 'admin' | 'signin' | 'signup' | 'recover';
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'admin',
}) => {
  const [tab, setTab] = useState<'admin' | 'signin' | 'signup' | 'recover'>(initialTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passkey, setPasskey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [artistHandle, setArtistHandle] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Feedback
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdminLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const admin = loginAsMasterAdmin();
      setIsLoading(false);
      setStatusMsg({
        type: 'success',
        text: 'Master Admin authentication confirmed! Full unlimited access granted.',
      });
      setTimeout(() => {
        onSuccess(admin);
        onClose();
      }, 600);
    }, 300);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!email) {
      setStatusMsg({ type: 'error', text: 'Please enter your registered email.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginUser(email, password, passkey);
      setIsLoading(false);
      if (res.success && res.user) {
        setStatusMsg({ type: 'success', text: `Welcome back, ${res.user.displayName}!` });
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 500);
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to sign in.' });
      }
    }, 300);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!email || !displayName || !securityAnswer) {
      setStatusMsg({ type: 'error', text: 'Please fill in all required fields including your security answer.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = registerUser({
        email,
        displayName,
        artistHandle,
        password,
        passkey: passkey || `IB-KEY-${Math.floor(1000 + Math.random() * 9000)}`,
        securityQuestion,
        securityAnswer,
      });
      setIsLoading(false);
      if (res.success && res.user) {
        setStatusMsg({
          type: 'success',
          text: `Account created successfully! Your recovery passkey is ${res.user.passkey}.`,
        });
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 800);
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Registration failed.' });
      }
    }, 350);
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!email) {
      setStatusMsg({ type: 'error', text: 'Please enter your account email.' });
      return;
    }

    if (!securityAnswer && !passkey) {
      setStatusMsg({ type: 'error', text: 'Please provide either your Security Answer or your Passkey to verify identity.' });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = recoverAccount({
        email,
        securityAnswer,
        passkey,
        newPassword,
      });
      setIsLoading(false);
      if (res.success && res.recoveredUser) {
        setStatusMsg({
          type: 'success',
          text: res.message || 'Credentials recovered successfully!',
        });
        setTimeout(() => {
          onSuccess(res.recoveredUser!);
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Could not verify account recovery.' });
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-amber-500/30 bg-slate-950 p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-900 transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600 shadow-lg text-slate-950 font-black">
            <Crown className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">indiebrotherhood Identity</h2>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                v2.6 Secure
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Unlimited Master Access, Artist Profile Environment & Passkey Recovery
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-6 text-[11px] font-bold">
          <button
            onClick={() => { setTab('admin'); setStatusMsg(null); }}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Master</span> Admin
          </button>
          <button
            onClick={() => { setTab('signin'); setStatusMsg(null); }}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'signin'
                ? 'bg-slate-800 text-amber-300 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setStatusMsg(null); }}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? 'bg-slate-800 text-amber-300 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Sign Up
          </button>
          <button
            onClick={() => { setTab('recover'); setStatusMsg(null); }}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              tab === 'recover'
                ? 'bg-slate-800 text-cyan-300 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Recovery
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMsg && (
          <div
            className={`mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : statusMsg.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            ) : (
              <HelpCircle className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
            )}
            <div className="flex-1">{statusMsg.text}</div>
          </div>
        )}

        {/* TAB 1: MASTER ADMIN ONE-CLICK ACCESS */}
        {tab === 'admin' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent p-5 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 mb-3">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                FOUNDER & MASTER ADMIN PROFILE
              </div>
              <h3 className="text-lg font-black text-white">Christopher Ray (Founder)</h3>
              <p className="text-xs text-amber-200/90 font-mono mt-0.5">{ADMIN_EMAIL}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-left text-[11px]">
                <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">App Access</span>
                  <span className="font-bold text-emerald-400">Unlimited 100%</span>
                </div>
                <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Hit Telemetry</span>
                  <span className="font-bold text-amber-300">Bypass Limits</span>
                </div>
                <div className="rounded-xl bg-slate-900/90 p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Master Passkey</span>
                  <span className="font-bold text-cyan-300 font-mono">MASTER-IB</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAdminLogin}
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 py-3.5 font-black text-slate-950 text-sm shadow-xl hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
              ) : (
                <Sparkles className="h-4 w-4 text-slate-950" />
              )}
              Instant One-Click Master Admin Login
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Instantly activates Founder status with all 10 tools unlocked, unlimited XP, and master authority.
            </p>
          </div>
        )}

        {/* TAB 2: SIGN IN */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@indiebrotherhood.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">OR USE PASSKEY</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Passkey / PIN</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
                <input
                  type="text"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="e.g. IB-KEY-8842 or custom passkey"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-cyan-300 font-mono placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-amber-500 py-3 font-bold text-slate-950 text-xs hover:bg-amber-400 transition flex items-center justify-center gap-2 mt-2"
            >
              {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Sign In to Artist Hub
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setTab('recover')}
                className="text-xs text-amber-400 hover:underline"
              >
                Forgot your password or passkey? Recover here
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: CREATE ACCOUNT */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Artist / Display Name *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Luna Vibe"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Artist Handle (@)</label>
                <input
                  type="text"
                  value={artistHandle}
                  onChange={(e) => setArtistHandle(e.target.value)}
                  placeholder="e.g. lunavibe_music"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@artistdomain.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-cyan-300 mb-1">Pick / Custom Passkey</label>
                <input
                  type="text"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="e.g. LUNA-KEY-77"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-cyan-300 font-mono placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* SECURITY QUESTION SECTION */}
            <div className="rounded-2xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <HelpCircle className="h-3.5 w-3.5" />
                Account Recovery Security Question *
              </div>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {SECURITY_QUESTIONS.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold">Secret Answer (Case-Insensitive) *</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your secret answer for 1-click recovery"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-emerald-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 py-3 font-black text-slate-950 text-xs shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Create Artist Account & Save Passkey
            </button>
          </form>
        )}

        {/* TAB 4: RECOVER LOGIN / PASSKEY */}
        {tab === 'recover' && (
          <form onSubmit={handleRecover} className="space-y-4">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-cyan-300 font-bold mb-1">
                <KeyRound className="h-4 w-4" />
                Instant Zero-Friction Account Recovery
              </div>
              Enter your registered email and either your <strong>Secret Security Answer</strong> or <strong>Passkey</strong> to immediately retrieve your account and set a new password.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Registered Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@indiebrotherhood.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Your Security Answer</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Answer chosen during signup"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1.5">OR Passkey / PIN</label>
                <input
                  type="text"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="e.g. IB-KEY-8842"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-cyan-300 font-mono placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Set New Password (Optional)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-cyan-500 py-3 font-bold text-slate-950 text-xs hover:bg-cyan-400 transition flex items-center justify-center gap-2"
            >
              {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Verify Identity & Restore Access
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
