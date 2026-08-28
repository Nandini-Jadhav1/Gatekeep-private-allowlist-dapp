# GateKeep — Private Allowlist Access
![CI](https://github.com/Nandini-Jadhav1/Gatekeep/actions/workflows/ci.yml/badge.svg)

> Zero-Knowledge Selective Disclosure dApp on Midnight Network.

## Live Demo & Walkthrough
- **Live dApp URL**: [https://gatekeep-midnight.vercel.app](https://gatekeep-midnight.vercel.app)
- **Demo Video Recording**: [Watch 1AM Wallet & ZK Circuit Demo Video](https://gatekeep-midnight.vercel.app)

## Contract Address
| Network | Address |
|---------|---------|
| Preprod | `0x4f8e3b29c17d92a10b4f62e8315a91d295034c71829e1a2f4c6b8d0e2a4b6c8` |

## What This Does
GateKeep allows users to prove membership in an allowlist using Midnight Compact circuits without exposing their identity or wallet credentials.

## Privacy Model
- **PUBLIC:** On-chain nullifier records, Merkle root commitment.
- **PRIVATE:** User secret key, proof witness parameters.
- **PROVED without revealing:** Eligibility membership in the Merkle root.

## Privacy Claim
An on-chain observer sees successful ZK proofs and unique nullifiers, but cannot link actions to specific public addresses or identity credentials.

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

## CI/CD
GitHub Actions workflow verifies code compilation, runs the Vitest suite (3+ tests), and executes Vite builds on every push to main.

## Product Proposal
See [PROPOSAL.md](PROPOSAL.md)
