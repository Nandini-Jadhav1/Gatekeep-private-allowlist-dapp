import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Lock, Unlock, ExternalLink, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface MemberPanelProps {
  onVerifyAccess: (memberSecret: string, memberSalt: string) => Promise<{ success: boolean; nullifierHex: string; unlockedResource: string }>;
  walletConnected: boolean;
}

export const MemberPanel: React.FC<MemberPanelProps> = ({
  onVerifyAccess,
  walletConnected,
}) => {
  const [memberSecret, setMemberSecret] = useState('member-invite-code-secret-42');
  const [memberSalt, setMemberSalt] = useState('member-salt-98765');
  
  const [loading, setLoading] = useState(false);
  const [unlockedResult, setUnlockedResult] = useState<{ nullifierHex: string; resourcePayload: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberSecret || !memberSalt) return;

    setLoading(true);
    setErrorMsg(null);
    setUnlockedResult(null);

    try {
      const res = await onVerifyAccess(memberSecret, memberSalt);
      if (res.success) {
        setUnlockedResult({
          nullifierHex: res.nullifierHex,
          resourcePayload: res.unlockedResource,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Access verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-cyan-900/40 relative">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-cyan-900/60 text-cyan-400 border border-cyan-700/50">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-sans">Member Private Access Portal</h2>
          <p className="text-xs text-slate-400">Generate local ZK proof from invite secret & claim gated resource privately</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Your Private Secret / Invite Token</label>
            <div className="relative">
              <input
                type="text"
                value={memberSecret}
                onChange={(e) => setMemberSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. member-invite-code-secret-42"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Never sent over network or recorded on-chain</p>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Your Private Secret Salt</label>
            <div className="relative">
              <input
                type="text"
                value={memberSalt}
                onChange={(e) => setMemberSalt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. member-salt-98765"
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Provided out-of-band by event organizer</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg glow-cyan flex items-center justify-center gap-2 transition"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Zero-Knowledge Circuit Proof...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Prove Membership & Claim Access</span>
            </>
          )}
        </button>
      </form>

      {/* Error / Double-Claim Alert */}
      {errorMsg && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Access Rejected</p>
            <p className="mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Unlocked Gated Resource Result */}
      {unlockedResult && (
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/50 glow-emerald animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
            <Unlock className="w-5 h-5" />
            <span>Access Verified — Gated Resource Unlocked!</span>
          </div>

          <p className="text-xs text-slate-300 mb-4">
            Zero-knowledge proof successfully validated on Midnight Network. Your nullifier has been committed without revealing your identity.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Unlocked Resource Link / Key:</span>
              <a
                href={unlockedResult.resourcePayload}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-cyan-300 hover:text-cyan-200 underline break-all flex items-center gap-1.5 mt-0.5"
              >
                <span>{unlockedResult.resourcePayload}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Public On-Chain Nullifier (Unlinkable Hash):</span>
              <code className="text-[11px] font-mono text-emerald-300 break-all bg-slate-900 p-1 rounded block mt-0.5">
                0x{unlockedResult.nullifierHex}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
