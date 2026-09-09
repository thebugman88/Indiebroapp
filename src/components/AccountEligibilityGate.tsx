import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { authenticatedFetch } from '../services/authService';

export function AccountEligibilityGate({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'allowed' | 'pending'>('checking');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkRevision, setCheckRevision] = useState(0);
  useEffect(() => {
    let live = true;
    if (userId === 'guest') { setState('allowed'); return () => { live = false; }; }
    setState('checking');
    authenticatedFetch('/api/account/age-status').then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!live) return;
      setState(response.ok && body.ageBand === 'minor' && body.guardianStatus !== 'approved' ? 'pending' : 'allowed');
    }).catch(() => { if (live) setState('checking'); });
    return () => { live = false; };
  }, [userId, checkRevision]);
  if (state === 'allowed') return <>{children}</>;
  if (state === 'checking') return <div role="status" className="grid min-h-[55vh] place-items-center text-sm text-zinc-400">Confirming account eligibility…</div>;
  return <section role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center">
    <Lock className="h-10 w-10 text-amber-400" aria-hidden="true" />
    <div><h2 className="text-xl font-black text-white">Guardian permission is required</h2><p className="mt-2 max-w-lg text-sm text-zinc-400">This teen account remains locked until a parent or legal guardian approves the emailed request. Adult-only community and explicit-content features remain unavailable after approval.</p></div>
    <form className="w-full max-w-md space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage('');
      try {
        const response = await authenticatedFetch('/api/account/guardian-approval/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guardianEmail }) });
        const body = await response.json().catch(() => ({}));
        setMessage(response.ok ? 'Approval email sent. Ask your guardian to open the single-use link within seven days.' : body.error || 'The approval email could not be sent.');
      } catch { setMessage('The approval email could not be sent. Try again later.'); }
      finally { setBusy(false); }
    }}>
      <label className="block text-sm font-bold text-zinc-200">Parent or guardian email<input required type="email" value={guardianEmail} onChange={event => setGuardianEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white" /></label>
      <button disabled={busy} className="w-full rounded-xl bg-amber-400 p-3 font-black text-zinc-950 disabled:opacity-50">{busy ? 'Sending…' : 'Send a new approval link'}</button>
      <button type="button" disabled={busy} onClick={() => setCheckRevision(value => value + 1)} className="w-full rounded-xl border border-zinc-700 p-3 font-bold text-white disabled:opacity-50">My guardian approved — check again</button>
      {message && <p className="text-sm text-amber-200">{message}</p>}
    </form>
    <p className="text-xs text-zinc-500">If you entered the wrong birth date, contact xchristopherrayx@gmail.com. Age records cannot be changed from the browser.</p>
  </section>;
}
