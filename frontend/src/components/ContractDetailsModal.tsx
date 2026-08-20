import React, { useState } from 'react';
import { FileCode, X, Copy, ExternalLink, ShieldCheck, Database, Check, Server } from 'lucide-react';
import { GateKeepState } from '../../../src/contract';

interface ContractDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerState: GateKeepState;
  contractAddress: string;
}

export const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({
  isOpen,
  onClose,
  ledgerState,
  contractAddress,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-cyan-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto"
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
          <div className="p-3 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-700/50 shadow-lg glow-cyan">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-sans">Midnight Smart Contract Inspector</h2>
            <p className="text-xs text-slate-400">Deployed GateKeep Compact contract details & on-chain state</p>
          </div>
        </div>

        {/* Deployed Contract Address Banner */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 mb-6">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Deployed Contract Address (Testnet Preprod):</span>
          <div className="flex items-center justify-between mt-1 gap-3">
            <code className="text-xs font-mono text-cyan-300 break-all bg-slate-950 p-2 rounded-xl border border-slate-800 flex-1">
              {contractAddress}
            </code>
            <button
              onClick={handleCopyContract}
              className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 text-xs font-mono flex items-center gap-1.5 shrink-0 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Network & Proof Infrastructure Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Server className="w-4 h-4" />
              <span>Midnight Network Services</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Indexer Endpoint:</span>
              <code className="text-slate-300 font-mono text-[11px]">https://indexer.testnet.midnight.network</code>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Proof Server Endpoint:</span>
              <code className="text-slate-300 font-mono text-[11px]">https://proof-server.testnet.midnight.network</code>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>ZK Proving Key Metadata</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Circuit Proving Protocol:</span>
              <span className="text-slate-300 font-mono text-[11px]">Groth16 / BLS12-381 Curve</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Compiler Version:</span>
              <span className="text-slate-300 font-mono text-[11px]">compactc-0.16.0</span>
            </div>
          </div>
        </div>

        {/* On-Chain Ledger State Parameters */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 mb-6">
          <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Current On-Chain Ledger Parameters</span>
          </h3>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Organizer Public Key:</span>
              <span className="text-indigo-300 truncate max-w-[240px]">
                {ledgerState.organizerPublicKeyHex ? `0x${ledgerState.organizerPublicKeyHex.slice(0, 16)}...` : 'Not Set'}
              </span>
            </div>

            <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Commitment State Root:</span>
              <span className="text-violet-300 truncate max-w-[240px]">
                {ledgerState.commitmentRootHex ? `0x${ledgerState.commitmentRootHex.slice(0, 16)}...` : '0x000...'}
              </span>
            </div>

            <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Allowlisted Members Count:</span>
              <span className="text-emerald-400 font-bold">{ledgerState.memberCount}</span>
            </div>

            <div className="flex justify-between p-2 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Total Verified Accesses:</span>
              <span className="text-cyan-400 font-bold">{ledgerState.verificationCount}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
};
