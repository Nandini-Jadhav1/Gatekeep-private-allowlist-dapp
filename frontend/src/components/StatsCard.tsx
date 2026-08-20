import React from 'react';
import { Users, CheckCircle2, Hash, Key } from 'lucide-react';

interface StatsCardProps {
  memberCount: number;
  verificationCount: number;
  commitmentRootHex: string;
  usedNullifiersCount: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  memberCount,
  verificationCount,
  commitmentRootHex,
  usedNullifiersCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Allowlisted Members */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Allowlisted Members</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{memberCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/50">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-indigo-300/70 mt-3 flex items-center gap-1">
          <span>Encrypted commitments on-chain</span>
        </p>
      </div>

      {/* Total Verified Accesses */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Verified Accesses</p>
            <h3 className="text-3xl font-extrabold text-cyan-400 mt-1">{verificationCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-cyan-300/70 mt-3 flex items-center gap-1">
          <span>Successful ZK proofs verified</span>
        </p>
      </div>

      {/* Used Nullifiers */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Nullifiers Record</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{usedNullifiersCount}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <Key className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-emerald-300/70 mt-3 flex items-center gap-1">
          <span>Unlinkable double-access protection</span>
        </p>
      </div>

      {/* Commitment Root Anchor */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:border-violet-500/40 transition-all">
        <div className="flex items-center justify-between">
          <div className="max-w-[80%]">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Commitment Root</p>
            <p className="font-mono text-xs text-violet-300 truncate mt-2 bg-slate-900/90 p-1.5 rounded border border-slate-800">
              {commitmentRootHex ? `${commitmentRootHex.slice(0, 10)}...${commitmentRootHex.slice(-8)}` : '0x000...000'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-violet-950/80 text-violet-400 border border-violet-800/50">
            <Hash className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-violet-300/70 mt-3">Merkle root state anchor</p>
      </div>
    </div>
  );
};
