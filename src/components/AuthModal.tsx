import React, { useState } from 'react';
import {inviteFromUrl,rememberReferralInvite} from '../../shared/referralInvite';
import { X } from 'lucide-react';
import { RegisteredUser, loginUser, registerUser, recoverAccount, logoutUser, resendVerification, getCurrentAuthUser, isAuthConfigured } from '../services/authService';
interface Props { isOpen: boolean; onClose: () => void; onSuccess: (user: RegisteredUser) => void; initialTab?: 'admin' | 'signin' | 'signup' | 'recover'; }
export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialTab = 'signin' }) => {
  const [tab, setTab] = useState(initialTab === 'admin' ? 'signin' : initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode,setReferralCode]=useState(inviteFromUrl);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (tab === 'recover') {
        const result = await recoverAccount({ email });
        setMessage(result.message || result.error || 'Please try again.');
      } else {
        if (tab === 'signup') {
          const result = await registerUser({ email, password, displayName });
          if (result.success && result.registeredUid) {
            rememberReferralInvite(result.registeredUid, referralCode);
            setPassword('');
            setTab('signin');
            setMessage(result.message || 'Verify your email, then sign in.');
          } else setMessage(result.error || 'Unable to create account.');
        } else {
          const result = await loginUser(email, password);
          if (result.success && result.user) {
            setPassword('');
            onSuccess(result.user);
            setMessage('Signed in.');
            onClose();
          } else setMessage(result.error || 'Unable to sign in.');
        }
      }
    } finally { setBusy(false); }
  };
  const action = async (fn: () => Promise<void>, success: string) => {
    setBusy(true);
    try { await fn(); setMessage(success); } catch { setMessage('Unable to complete that request. Please try again.'); }
    finally { setBusy(false); }
  };
  const fieldClass = 'w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-white';
  return <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-slate-950 p-6 text-white">
      <button aria-label="Close sign-in" onClick={onClose} className="absolute right-4 top-4"><X /></button>
      <h2 id="auth-title" className="text-xl font-bold mb-4">Your IndieBrotherhood account</h2>
      <div className="flex gap-3 mb-5">{(['signin', 'signup', 'recover'] as const).map(value => <button key={value} onClick={() => { setTab(value); setMessage(''); setPassword(''); }} className={tab === value ? 'text-amber-400' : 'text-slate-400'}>{value === 'signin' ? 'Sign in' : value === 'signup' ? 'Create account' : 'Reset password'}</button>)}</div>
      {!isAuthConfigured && <p className="text-amber-300 mb-4">Account sign-in is not configured yet. Creative tools can still be explored as a guest.</p>}
      <p className="text-sm text-slate-300 mb-4">For shared-device privacy, your session and encryption keys stay in memory. Refreshing or closing this page requires signing in again. Download work you want to keep.</p>
      <form onSubmit={submit} className="space-y-4">
        {tab === 'signup' && <label className="block">Artist name<input required value={displayName} onChange={e => setDisplayName(e.target.value)} autoComplete="nickname" className={fieldClass} /></label>}
        {tab==='signup'&&<label className="block text-sm">Referral code (optional)<input className={fieldClass} value={referralCode} maxLength={24} pattern="[A-Fa-f0-9]{24}" onChange={e=>setReferralCode(e.target.value.toUpperCase())}/><span className="mt-1 block text-xs text-slate-400">After verifying your email, open Invite & Earn to attach it and complete the checklist. Save this code if you close the page.</span></label>}
        <label className="block">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className={fieldClass} /></label>
        {tab !== 'recover' && <label className="block">Password<input required type="password" minLength={tab === 'signup' ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} className={fieldClass} /></label>}
        <button disabled={busy || !isAuthConfigured} className="w-full rounded-xl bg-amber-400 text-slate-950 p-3 font-bold disabled:opacity-50">{busy ? 'Please wait…' : tab === 'recover' ? 'Send reset email' : tab === 'signup' ? 'Create account' : 'Sign in'}</button>
      </form>
      <p role="status" className="mt-4 text-sm text-amber-200">{message}</p>
      {getCurrentAuthUser().id !== 'guest' && <div className="flex gap-4 mt-4 text-sm"><button disabled={busy} onClick={() => action(resendVerification, 'Verification email sent.')}>Resend verification</button><button disabled={busy} onClick={() => action(logoutUser, 'Signed out.')}>Sign out</button></div>}
      <p className="mt-4 text-xs text-slate-400">Admin access requires a verified account with a server-issued admin claim. Legacy demo passwords and passkeys no longer grant access.</p>
    </section>
  </div>;
};
