# Product Proposal: GateKeep — Private Allowlist Access dApp on Midnight

## 1. Problem Statement
Token-gated drops, exclusive community invites, and private events currently rely on public allowlists or web2 authentication servers. 
- **Public Allowlists On-Chain**: Publishing Ethereum/Solana wallet addresses on-chain permanently ties user identities, wallet balances, and transaction histories to gated communities. Anyone observing the blockchain can profile users or front-run activity.
- **Web2 Authorization Centralization**: Off-chain OAuth / Discord bots require trusting a central server to store member registries, creating single points of failure and data leak risks.

## 2. Chosen Idea & Category
- **Project Name**: GateKeep
- **Idea Category**: Private Allowlist Access — Prove membership without revealing identity.
- **Target Network**: Midnight Network (Zero-Knowledge Smart Contracts).

## 3. Why Midnight & Selective Disclosure are the Right Fit
Midnight's Compact programming language enables zero-knowledge selective disclosure, providing the ideal architecture for private allowlist access:
- **Private Witness**: The member's raw secret key and specific allowlist commitment location remain strictly off-chain in private state.
- **Public Ledger Verification**: The Midnight contract verifies a zero-knowledge proof against the on-chain commitment root and records an unlinkable nullifier.
- **Zero-Knowledge Proofs**: Observers verify that *a valid member* accessed the gated resource without discovering *who* accessed it or which address submitted the proof.
- **Cryptographic Nullifiers**: Prevents double-claiming access while ensuring nullifiers cannot be linked back to the member's wallet or secret.

## 4. Scope for Current Cycle
- **Compact Smart Contract (`GateKeep.compact`)**: Ledger state holding commitment roots, verification counter, gated resource hash, and organizer access controls.
- **Cryptographic Nullifier Circuit**: Derives nullifiers via `persistent_hash(secret, domainSeparator)` for double-access prevention.
- **Vitest Unit Test Suite**: Thorough test suite verifying valid proofs, non-member rejections, double-access prevention, organizer authorization, and counter state updates.
- **Frontend Web Application**: Next.js & TypeScript UI with organizer management panel, member ZK proof submission, live state counters, and dark-themed UI.
- **CI/CD Pipeline**: GitHub Actions workflow compiling Compact contracts and running test suites automatically.
