import React from 'react';
import { ShieldCheck, Wallet, Lock, Sparkles } from 'lucide-react';

interface HeaderProps {
  walletConnected: boolean;
  walletAddress: string;
  onToggleWallet: () => void;
  networkName: string;
}

export const Header: React.FC<HeaderProps> = ({
  walletConnected,
  walletAddress,
  onToggleWallet,
  networkName,
}) => {
  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-slate-800/80 px-6 py-4 mb-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg glow-purple">
            <ShieldCheck className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">GateKeep</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Midnight ZK
              </span>
            </div>
            <p className="text-xs text-slate-400">Private Allowlist Access dApp</p>
          </div>
        </div>

        {/* Network & Wallet controls */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Network: <strong className="text-cyan-400 font-semibold">{networkName}</strong></span>
          </div>

          <button
            onClick={onToggleWallet}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 shadow-md ${
              walletConnected
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-900/30 glow-purple'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>
              {walletConnected
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} (Lace Wallet)`
                : 'Connect Midnight Wallet'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
