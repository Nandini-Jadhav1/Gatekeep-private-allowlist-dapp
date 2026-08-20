import React, { useState } from 'react';
import { UserPlus, Settings, Key, Link, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { deriveCommitment, deriveOrganizerKey, sha256, toHex } from '../../../src/merkle';

interface OrganizerPanelProps {
  onInitialize: (organizerSecret: string, gatedResourcePayload: string) => Promise<void>;
  onAddMember: (organizerSecret: string, memberSecret: string, memberSalt: string) => Promise<string>;
  isInitialized: boolean;
}

export const OrganizerPanel: React.FC<OrganizerPanelProps> = ({
  onInitialize,
  onAddMember,
  isInitialized,
}) => {
  const [organizerSecret, setOrganizerSecret] = useState('organizer-master-key-999');
  const [resourcePayload, setResourcePayload] = useState('https://discord.gg/invite/private-vip-midnight-gatekeep-2026');
  
  const [memberSecret, setMemberSecret] = useState('');
  const [memberSalt, setMemberSalt] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string; commitmentHex?: string } | null>(null);

  const handleInitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerSecret || !resourcePayload) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      await onInitialize(organizerSecret, resourcePayload);
      setStatusMsg({
        type: 'success',
        text: 'GateKeep contract initialized successfully with organizer public key & gated resource hash!',
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Failed to initialize contract',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerSecret || !memberSecret || !memberSalt) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      const commitmentHex = await onAddMember(organizerSecret, memberSecret, memberSalt);
      setStatusMsg({
        type: 'success',
        text: 'Member commitment added to allowlist state root!',
        commitmentHex,
      });
      setMemberSecret('');
      setMemberSalt('');
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Failed to add member commitment',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomSecret = () => {
    const randomSecret = 'sec_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const randomSalt = 'salt_' + Math.random().toString(36).substring(2, 10);
    setMemberSecret(randomSecret);
    setMemberSalt(randomSalt);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-900/40">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-indigo-900/60 text-indigo-400 border border-indigo-700/50">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-sans">Organizer Administration Portal</h2>
          <p className="text-xs text-slate-400">Deploy contract, manage gated resource payloads & register member commitments</p>
        </div>
      </div>

      {/* Contract Initialization Section */}
      <form onSubmit={handleInitSubmit} className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 mb-6">
        <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
          <Key className="w-4 h-4" />
          <span>1. Contract & Gated Resource Setup</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Organizer Master Secret Key</label>
            <input
              type="password"
              value={organizerSecret}
              onChange={(e) => setOrganizerSecret(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. organizer-master-key-999"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Gated Resource Link / Secret Code</label>
            <input
              type="text"
              value={resourcePayload}
              onChange={(e) => setResourcePayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. https://discord.gg/private-vip-invite"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
          <span>{isInitialized ? 'Re-Initialize Contract' : 'Initialize Contract & Resource'}</span>
        </button>
      </form>

      {/* Add Member Commitment Section */}
      <form onSubmit={handleAddMemberSubmit} className="bg-slate-900/90 p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span>2. Add Member Commitment to Allowlist</span>
          </h3>
          <button
            type="button"
            onClick={generateRandomSecret}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-800"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Generate Random Secret</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Member Secret (Invite Code)</label>
            <input
              type="text"
              value={memberSecret}
              onChange={(e) => setMemberSecret(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. member-invite-code-secret-42"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Member Secret Salt</label>
            <input
              type="text"
              value={memberSalt}
              onChange={(e) => setMemberSalt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. member-salt-98765"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>Publish Commitment to On-Chain Allowlist</span>
        </button>
      </form>

      {/* Status Feedback Notification */}
      {statusMsg && (
        <div className={`mt-4 p-4 rounded-xl text-xs flex items-start gap-3 border ${
          statusMsg.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border-red-500/40 text-red-300'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
          <div>
            <p className="font-semibold">{statusMsg.text}</p>
            {statusMsg.commitmentHex && (
              <p className="font-mono mt-1 text-[11px] opacity-80 break-all">
                Generated Commitment Hash: 0x{statusMsg.commitmentHex}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
