import React from 'react';
import { ShieldAlert, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

export const PrivacyModelDocs: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-900/40 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-violet-900/60 text-violet-400 border border-violet-700/50">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-sans">GateKeep Privacy Model & Zero-Knowledge Architecture</h2>
          <p className="text-xs text-slate-400">Formal specification of public ledger visibility vs private client-side witnesses</p>
        </div>
      </div>

      <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-4">
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
          <h3 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>Publicly Visible On-Chain / To Observers</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li><strong>Commitment Root:</strong> The SHA-256 state anchor of the allowlist member commitments.</li>
            <li><strong>Proof Validity:</strong> Observers verify that a valid membership proof was submitted and accepted by the Compact circuit.</li>
            <li><strong>Derived Nullifier:</strong> A cryptographic hash (<code className="font-mono text-cyan-300">hash(secret, domain)</code>) that prevents double access without exposing identity.</li>
            <li><strong>Verified Access Count:</strong> Running counter of total successful verifications.</li>
            <li><strong>Contract Code:</strong> Open-source Compact circuit compiled to WebAssembly.</li>
          </ul>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
          <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            <span>Never Visible to Anyone Except the Member</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li><strong>Raw Secret / Invite Code:</strong> Stays in local memory during ZK proof generation.</li>
            <li><strong>Allowlist Entry Index:</strong> ZK path hiding guarantees observers cannot infer which commitment entry belongs to the member.</li>
            <li><strong>Wallet Address Linkage:</strong> Nullifiers are derived strictly from the secret, avoiding binding the user's connected wallet address.</li>
            <li><strong>Decrypted Gated Resource:</strong> Unlocked client-side only upon proof verification.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
