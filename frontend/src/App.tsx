import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { PrivacyBadge } from './components/PrivacyBadge';
import { OrganizerPanel } from './components/OrganizerPanel';
import { MemberPanel } from './components/MemberPanel';
import { PrivacyModelDocs } from './components/PrivacyModelDocs';
import { WalletModal } from './components/WalletModal';
import { ContractDetailsModal } from './components/ContractDetailsModal';
import { GateKeepClient, GateKeepState } from '../../src/contract';
import { ShieldCheck, Users, KeyRound, Info, Sparkles, FileCode } from 'lucide-react';

export default function App() {
  const [client] = useState(() => new GateKeepClient());
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'organizer' | 'member' | 'privacy'>('overview');
  
  // Wallet modal & connection state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  
  const [walletConnected, setWalletConnected] = useState(true);
  const [walletName, setWalletName] = useState('Lace Wallet');
  const [walletAddress, setWalletAddress] = useState('midnight1q9x2a4v8h9k0l3m5n7p2r4t6v8x0z2y4w6');
  const [networkName] = useState('Midnight Testnet (Preprod)');
  const [contractAddress] = useState('0x4f8e3b29c17d92a10b4f62e8315a91d295034c71829e1a2f4c6b8d0e2a4b6c8');

  const [ledgerState, setLedgerState] = useState<GateKeepState>({
    organizerPublicKeyHex: '',
    commitmentRootHex: '',
    memberCount: 0,
    verificationCount: 0,
    gatedResourceHashHex: '',
    usedNullifiersCount: 0,
  });

  useEffect(() => {
    // Default initialization for demo
    const defaultInit = async () => {
      try {
        await client.initialize(
          'organizer-master-key-999',
          'https://discord.gg/invite/private-vip-midnight-gatekeep-2026'
        );
        setIsInitialized(true);
        setLedgerState(client.getLedgerState());
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    defaultInit();
  }, [client]);

  const refreshState = () => {
    setLedgerState(client.getLedgerState());
  };

  const handleInitialize = async (organizerSecret: string, gatedResourcePayload: string) => {
    await client.initialize(organizerSecret, gatedResourcePayload);
    setIsInitialized(true);
    refreshState();
  };

  const handleAddMember = async (organizerSecret: string, memberSecret: string, memberSalt: string) => {
    const commitmentHex = await client.addMember(organizerSecret, memberSecret, memberSalt);
    refreshState();
    return commitmentHex;
  };

  const handleVerifyAccess = async (memberSecret: string, memberSalt: string) => {
    const result = await client.verifyAccess(memberSecret, memberSalt);
    refreshState();
    return result;
  };

  const handleConnectWallet = (name: string, address: string) => {
    setWalletName(name);
    setWalletAddress(address);
    setWalletConnected(true);
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
  };

  return (
    <div className="min-h-screen pb-16">
      <Header
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        walletName={walletName}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onOpenContractModal={() => setContractModalOpen(true)}
        networkName={networkName}
      />

      <main className="max-w-7xl mx-auto px-6">
        {/* Hero banner section */}
        <div className="glass-panel p-8 rounded-3xl mb-8 relative overflow-hidden border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-mono mb-4">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zero-Knowledge Selective Disclosure dApp</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
              Prove Allowlist Membership <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                Without Revealing Your Identity
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              GateKeep uses Midnight's Compact zero-knowledge circuits to verify private credentials, prevent double access claims with unlinkable nullifiers, and unlock gated resources — all while keeping member identities off-chain.
            </p>

            {/* Tab selection buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-lg glow-purple'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Overview & Metrics</span>
              </button>

              <button
                onClick={() => setActiveTab('member')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'member'
                    ? 'bg-cyan-600 text-white shadow-lg glow-cyan'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Member Access Portal</span>
              </button>

              <button
                onClick={() => setActiveTab('organizer')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'organizer'
                    ? 'bg-emerald-600 text-white shadow-lg glow-emerald'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Organizer Portal</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'privacy'
                    ? 'bg-violet-600 text-white shadow-lg'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Privacy Model</span>
              </button>

              <button
                onClick={() => setContractModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-700/50 transition"
              >
                <FileCode className="w-4 h-4" />
                <span>Inspect Contract Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Ledger Stats Cards */}
        <StatsCard
          memberCount={ledgerState.memberCount}
          verificationCount={ledgerState.verificationCount}
          commitmentRootHex={ledgerState.commitmentRootHex}
          usedNullifiersCount={ledgerState.usedNullifiersCount}
        />

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <PrivacyBadge />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MemberPanel
                onVerifyAccess={handleVerifyAccess}
                walletConnected={walletConnected}
              />
              <OrganizerPanel
                onInitialize={handleInitialize}
                onAddMember={handleAddMember}
                isInitialized={isInitialized}
              />
            </div>
          </div>
        )}

        {activeTab === 'member' && (
          <MemberPanel
            onVerifyAccess={handleVerifyAccess}
            walletConnected={walletConnected}
          />
        )}

        {activeTab === 'organizer' && (
          <OrganizerPanel
            onInitialize={handleInitialize}
            onAddMember={handleAddMember}
            isInitialized={isInitialized}
          />
        )}

        {activeTab === 'privacy' && <PrivacyModelDocs />}
      </main>

      {/* Interactive Wallet Connection Popup Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      {/* Interactive Contract Inspector Popup Modal */}
      <ContractDetailsModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        ledgerState={ledgerState}
        contractAddress={contractAddress}
      />

      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 GateKeep — Built on Midnight Network with Compact ZK Smart Contracts</p>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <button onClick={() => setContractModalOpen(true)} className="text-cyan-400 hover:underline">
            Deployed Contract: 0x4f8e...92a1
          </button>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">Status: Testnet Active</span>
        </div>
      </footer>
    </div>
  );
}
