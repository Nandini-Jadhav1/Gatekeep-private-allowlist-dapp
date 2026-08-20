import React from 'react';
import { Eye, EyeOff, ShieldCheck, Database, Lock } from 'lucide-react';

export const PrivacyBadge: React.FC = () => {
  return (
    <div className="glass-panel p-6 rounded-2xl mb-8 border border-indigo-900/40 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-indigo-900/50 text-indigo-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold text-white font-sans">Midnight Privacy Architecture Matrix</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public On-Chain Ledger State */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-cyan-400 font-semibold text-sm">
            <Eye className="w-4 h-4" />
            <span>Publicly Visible On-Chain Data</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Commitment State Root:</strong> Cryptographic SHA-256 state root anchor of the allowlist set.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Derived Nullifier:</strong> Cryptographic hash preventing double access, strictly unlinkable to user identity.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Verification Count:</strong> Aggregate total count of valid proof submissions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Open Source Smart Contract:</strong> Verified Compact circuit logic compiled to WebAssembly.</span>
            </li>
          </ul>
        </div>

        {/* Private Off-Chain Witness Data */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-sm">
            <EyeOff className="w-4 h-4" />
            <span>Strictly Private Off-Chain Data</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Member Raw Secret / Invite Code:</strong> Never exposed on-chain or transmitted over network.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Specific Commitment Position:</strong> Observers cannot tell which entry in the set corresponds to the user.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Wallet Address Unlinkability:</strong> Nullifier derived via <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300 font-mono">hash(secret, domain)</code> without binding wallet PK.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Unlocked Resource Payload:</strong> Decrypted client-side only upon valid ZK proof execution.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
