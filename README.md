# GateKeep — Private Allowlist Access
![CI](https://github.com/Nandini-Jadhav1/Gatekeep/actions/workflows/ci.yml/badge.svg)

> Privacy-focused allowlist dApp designed for Midnight Network using Compact smart contracts.

## Current Implementation Status

**Contract Logic & Privacy Model:** Fully designed and implemented as a Compact source file (`contracts/GateKeep.compact`) following Midnight's zero-knowledge privacy specification.

**Circuit Compilation:** Not yet performed. The Midnight `compactc` compiler requires Linux/macOS or WSL and is not available on native Windows. Current testing uses a TypeScript reference simulator (`contracts/managed/GateKeep/index.ts`) that implements the same state machine logic for development and testing purposes.

**Deployment:** Not yet deployed to Midnight Network. The contract address shown below is illustrative/placeholder pending actual compilation and deployment.

**Why This Matters:** This submission demonstrates a complete Compact contract design with proper privacy boundaries (public ledger state vs private witnesses), nullifier-based double-claim prevention, and organizer-controlled access. The circuit is ready to compile and deploy once the toolchain is available in the development environment.

## Live Demo & Walkthrough
- **Live dApp URL**: [https://gatekeep-midnight.vercel.app](https://gatekeep-midnight.vercel.app)
- **Demo Video Recording:** [Watch 1AM Wallet Integration Demo](https://github.com/Nandini-Jadhav1/Gatekeep-private-allowlist-dapp/issues/1)

## Contract Address
| Network | Status |
|---------|--------|
| Preprod | Placeholder: `0x4f8e3b29c17d92a10b4f62e8315a91d295034c71829e1a2f4c6b8d0e2a4b6c8` (not deployed) |

## What This Does
GateKeep demonstrates a privacy-preserving allowlist system designed for Midnight Network. The Compact contract specifies how users would prove membership without exposing their identity, using cryptographic commitments and unlinkable nullifiers.

## Designed Privacy Model
The Compact contract (`contracts/GateKeep.compact`) specifies the following privacy boundaries:

- **PUBLIC (On-chain ledger state):** Nullifier records, commitment root, member/verification counters.
- **PRIVATE (ZK witnesses, never revealed):** User secret key, salt parameters.
- **ENFORCED BY CIRCUIT (when compiled):** Commitment validity, nullifier uniqueness, membership proofs.

## Intended Privacy Properties
When compiled and deployed, an on-chain observer would see successful membership verifications and unique nullifiers, but could not link actions to specific public addresses or determine which specific member accessed the resource.

## Tech Stack
- Compact Smart Contracts
- React + TypeScript + Vite
- Midnight dApp Connector API
- Tailwind CSS

## Prerequisites
- Node.js v22
- 1AM Wallet extension installed

## Setup & Run Locally
```bash
npm install
npm run dev
```

## Run Tests
```bash
npm test
```

## To Compile with Real Midnight Toolchain

This project is ready for real ZK circuit compilation once the Midnight toolchain is available:

1. **Install compactc** (requires Linux/macOS or WSL):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://install.midnight.network | sh
   ```

2. **Compile the circuit**:
   ```bash
   compactc compile contracts/GateKeep.compact --output contracts/managed/GateKeep
   ```

3. **Deploy to Preprod**:
   ```bash
   midnight deploy --network preprod --contract contracts/managed/GateKeep
   ```

4. **Update the contract address** in README.md and frontend configuration with the real deployed address.

The current TypeScript simulator (`contracts/managed/GateKeep/index.ts`) will be replaced by actual compiler output, enabling real zero-knowledge proofs.

## CI/CD
GitHub Actions workflow verifies code compilation, runs the Vitest suite (3+ tests), and executes Vite builds on every push to main.

## Product Proposal
See [PROPOSAL.md](PROPOSAL.md)
