import React, { useState } from 'react';
import { Wallet, X, CheckCircle2, ShieldCheck, Cpu, ExternalLink, ArrowRight, RefreshCw } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletConnected: boolean;
  walletAddress: string;
  onConnectWallet: (walletName: string, address: string) => void;
  onDisconnectWallet: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  walletConnected,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
}) => {
  const [selectedWallet, setSelectedWallet] = useState<'lace' | '1am' | 'cli'>('lace');
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const wallets = [
    {
      id: 'lace',
      name: 'Lace Wallet (Midnight Testnet)',
      description: 'Official Cardano & Midnight browser extension wallet with ZK proof capability',
      icon: '💜',
      detected: true,
      address: 'midnight1q9x2a4v8h9k0l3m5n7p2r4t6v8x0z2y4w6',
    },
    {
      id: '1am',
      name: '1AM Wallet',
      description: 'Web-based privacy wallet tailored for Midnight zero-knowledge dApps',
      icon: '🛡️',
      detected: true,
      address: 'midnight1q8y3b5w9j1k2m4n6p8r0t2v4x6z8y1w3',
    },
    {
      id: 'cli',
      name: 'Midnight CLI Proof Provider',
      description: 'Local node ZK prover & private state key ring connector',
      icon: '⚡',
      detected: true,
      address: 'midnight1q7z4c6x0k2m4n6p8r0t2v4x6z8y1w5',
    },
  ];

  const handleConnect = (walletId: string, defaultAddr: string) => {
    setConnecting(true);
    setTimeout(() => {
      onConnectWallet(
        walletId === 'lace' ? 'Lace Wallet' : walletId === '1am' ? '1AM Wallet' : 'Midnight CLI',
        defaultAddr
      );
      setConnecting(false);
      onClose();
    }, 800);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-indigo-500/30 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900/80 border border-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg glow-purple">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-sans">
              {walletConnected ? 'Midnight Wallet Connected' : 'Connect Midnight Wallet'}
            </h2>
            <p className="text-xs text-slate-400">
              {walletConnected ? 'Manage active account & ZK proving keys' : 'Select a Web3 wallet extension to interact with GateKeep'}
            </p>
          </div>
        </div>

        {/* Connected Wallet View */}
        {walletConnected ? (
          <div className="space-y-4">
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-emerald-500/40 glow-emerald">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Active Connection: Lace Wallet
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  Preprod Testnet
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-3">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Account Address:</span>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-xs font-mono text-cyan-300 truncate max-w-[280px]">
                    {walletAddress}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="text-xs px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono transition"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">NIGHT Balance:</span>
                  <span className="font-bold text-indigo-400">1,250.00 tNIGHT</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">DUST Balance:</span>
                  <span className="font-bold text-cyan-400">50,000 tDUST</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onDisconnectWallet}
                className="w-full py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-500/40 text-xs font-semibold transition"
              >
                Disconnect Wallet
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Wallet Selection View */
          <div className="space-y-3">
            {wallets.map((w) => (
              <div
                key={w.id}
                onClick={() => setSelectedWallet(w.id as any)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedWallet === w.id
                    ? 'bg-slate-900/90 border-indigo-500 glow-purple'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{w.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {w.name}
                        {w.detected && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-normal">
                            Detected
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{w.description}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="wallet"
                    checked={selectedWallet === w.id}
                    onChange={() => setSelectedWallet(w.id as any)}
                    className="accent-indigo-500 w-4 h-4"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                const target = wallets.find((w) => w.id === selectedWallet);
                handleConnect(selectedWallet, target?.address || '');
              }}
              disabled={connecting}
              className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl glow-purple flex items-center justify-center gap-2 transition"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Midnight Wallet Extension...</span>
                </>
              ) : (
                <>
                  <span>Connect Selected Wallet</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
