import React, { useState } from 'react';
import {
  Wallet,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Shield,
  HelpCircle,
  Terminal,
  Layers,
} from 'lucide-react';
import { WalletType, WalletDetectionState, WalletAlertError } from '../hooks/useMidnightWallet';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletConnected: boolean;
  walletName: string;
  walletAddress: string;
  connecting: boolean;
  alertError: WalletAlertError | null;
  detectionState: WalletDetectionState;
  onConnectWallet: (walletId: WalletType) => Promise<boolean>;
  onDisconnectWallet: () => void;
  onRefreshDetection: () => void;
  onClearAlert: () => void;
  onSimulateConnect?: (walletName: string, defaultAddr: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  walletConnected,
  walletName,
  walletAddress,
  connecting,
  alertError,
  detectionState,
  onConnectWallet,
  onDisconnectWallet,
  onRefreshDetection,
  onClearAlert,
  onSimulateConnect,
}) => {
  const [selectedWallet, setSelectedWallet] = useState<WalletType>('1am');
  const [copied, setCopied] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (detectionState['1am']) {
        setSelectedWallet('1am');
      }
    }
  }, [isOpen, detectionState]);

  if (!isOpen) return null;

  const walletOptions = [
    {
      id: '1am' as WalletType,
      name: '1AM Wallet',
      description: 'Web3 ZK wallet extension injected at window.midnight["1am"]',
      icon: '🛡️',
      detected: detectionState['1am'],
      injectionKey: 'window.midnight["1am"]',
      defaultAddress: 'midnight1q8y3b5w9j1k2m4n6p8r0t2v4x6z8y1w3',
    },
    {
      id: 'lace' as WalletType,
      name: 'Lace Wallet (Midnight Testnet)',
      description: 'Cardano & Midnight browser extension injected at window.midnight.lace',
      icon: '💜',
      detected: detectionState.lace,
      injectionKey: 'window.midnight.lace',
      defaultAddress: 'midnight1q9x2a4v8h9k0l3m5n7p2r4t6v8x0z2y4w6',
    },
    {
      id: 'cli' as WalletType,
      name: 'Midnight CLI Proof Provider',
      description: 'Local node ZK prover & private state key ring connector',
      icon: '⚡',
      detected: true,
      injectionKey: 'localhost:6300 (Local Prover)',
      defaultAddress: 'midnight1q7z4c6x0k2m4n6p8r0t2v4x6z8y1w5',
    },
  ];

  const handleConnectClick = async () => {
    onClearAlert();
    if (simulationMode && onSimulateConnect) {
      const target = walletOptions.find((w) => w.id === selectedWallet);
      const nameStr =
        selectedWallet === '1am'
          ? '1AM Wallet'
          : selectedWallet === 'lace'
          ? 'Lace Wallet'
          : 'Midnight CLI';
      onSimulateConnect(nameStr, target?.defaultAddress || '');
      onClose();
      return;
    }

    const success = await onConnectWallet(selectedWallet);
    if (success) {
      onClose();
    }
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
              {walletConnected
                ? 'Manage active account & ZK proving keys'
                : 'Select an injected extension or CLI prover to connect'}
            </p>
          </div>
        </div>

        {/* Connected View */}
        {walletConnected ? (
          <div className="space-y-4">
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-emerald-500/40 glow-emerald">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Active Connection: {walletName}
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
          /* Selection View */
          <div className="space-y-4">
            {/* Fallback Alert Banner */}
            {alertError && (
              <div className="p-4 rounded-2xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs shadow-lg animate-fadeIn">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-amber-300">{alertError.title}</h4>
                      <button
                        onClick={onClearAlert}
                        className="text-amber-400 hover:text-white text-[10px] uppercase font-mono underline"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="mt-1 text-slate-300 text-xs leading-relaxed">{alertError.message}</p>
                    {alertError.actionHint && (
                      <p className="mt-2 text-amber-300/90 bg-slate-950/60 p-2 rounded-lg border border-amber-800/40 font-mono text-[11px]">
                        💡 <strong>Next Step:</strong> {alertError.actionHint}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={onRefreshDetection}
                        className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-600/50 text-[11px] font-semibold flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin-slow" />
                        <span>Refresh Extension Detection</span>
                      </button>

                      {onSimulateConnect && (
                        <button
                          onClick={() => setSimulationMode(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 text-[11px] font-mono transition"
                        >
                          Enable Simulation Mode
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet list */}
            <div className="space-y-3">
              {walletOptions.map((w) => {
                const isSelected = selectedWallet === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      setSelectedWallet(w.id);
                      onClearAlert();
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900/90 border-indigo-500 glow-purple shadow-xl'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{w.icon}</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white font-sans">{w.name}</h3>
                            {w.detected ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-mono font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Detected
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-700/50 font-mono font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Not Detected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{w.description}</p>
                          <span className="inline-block mt-1.5 text-[10px] font-mono text-cyan-400/80 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {w.injectionKey}
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="wallet"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedWallet(w.id);
                          onClearAlert();
                        }}
                        className="accent-indigo-500 w-4 h-4 mt-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulation mode info box if enabled */}
            {simulationMode && (
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between font-mono">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Simulation Mode Active (Dev Mode)
                </span>
                <button
                  onClick={() => setSimulationMode(false)}
                  className="text-[10px] text-slate-400 hover:text-white underline"
                >
                  Disable
                </button>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-2 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={onRefreshDetection}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0"
                  title="Rescan browser window for window.midnight objects"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rescan Window</span>
                </button>

                <button
                  onClick={handleConnectClick}
                  disabled={connecting}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl glow-purple flex items-center justify-center gap-2 transition"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {selectedWallet === '1am'
                          ? 'Connecting to 1AM Wallet Extension...'
                          : selectedWallet === 'lace'
                          ? 'Connecting to Lace Wallet Extension...'
                          : 'Connecting to Midnight CLI...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {simulationMode
                          ? `Simulate ${selectedWallet === '1am' ? '1AM Wallet' : selectedWallet === 'lace' ? 'Lace Wallet' : 'Midnight CLI'}`
                          : selectedWallet === '1am'
                          ? 'Connect 1AM Wallet'
                          : selectedWallet === 'lace'
                          ? 'Connect Lace Wallet'
                          : 'Connect Midnight CLI'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
