# Product Proposal

## What is the product, and who uses it?
**GateKeep** is a privacy-first zero-knowledge selective disclosure allowlist access protocol built on the Midnight Network. 

It targets two key user segments:
1. **Event Organizers & dApp Founders**: Who require verifiable allowlists for gated resources (e.g. VIP Discord access, token presale allowlists, private alpha product drops, exclusive governance portals) without having to store or manage sensitive personal user identifiers or public wallet addresses.
2. **Privacy-Conscious Web3 Users**: Who want to prove their right to access exclusive perks or gated resources without linking their on-chain wallet history, real-world identity, or email to their allowlist activity.

GateKeep leverages Midnight's Compact smart contract language to verify off-chain Merkle membership proofs and issue unlinkable nullifiers on-chain.

## Why Midnight specifically?
Transparent blockchains like Ethereum or Cardano mainnet reveal every transaction sender, account balance, and state mutation to the public. If an allowlist dApp is deployed on a transparent ledger:
- Every member's public key or address is visible in the contract state.
- Claiming access directly links the user's public identity to the gated resource.
- Sybil attacks or double-claiming can only be prevented by tracking public addresses, completely breaking user anonymity.

Midnight solves this fundamentally through **Compact ZK smart contracts**:
- **Private Witness Computations**: A user's invite token secret key and Merkle path remain strictly local on their device as private witnesses.
- **Selective Disclosure**: Midnight's ZK circuits verify that the user knows a valid secret corresponding to a member commitment in the contract's Merkle root *without* exposing the secret itself or the user's wallet address.
- **Unlinkable Nullifiers**: Midnight ledger records an encrypted/hashed nullifier upon verification, ensuring a single member cannot claim access twice while preventing any observer from linking the nullifier back to the original member identity or wallet.

## Data Model
| Data Point | Type | Disclosed To |
|---|---|---|
| Commitment Merkle Root | Public Ledger State | Everyone (On-chain) |
| On-Chain Nullifier Set | Public Ledger State | Everyone (On-chain) |
| Total Member & Verification Counters | Public Ledger State | Everyone (On-chain) |
| Gated Resource Hash | Public Ledger State | Everyone (On-chain) |
| Organizer Secret & Master Key | Private Organizer Witness | Event Organizer Only (Local) |
| Member Invite Secret & Salt | Private Member Witness | Member Only (Local Device) |
| Member Merkle Proof & Witness Path | Private Circuit Witness | Midnight ZK Prover Only (Local) |
| User Wallet Address & Transaction Sender | Private Network Context | Unlinked from ZK Nullifier |

## Mainnet Feasibility
GateKeep is designed from the ground up for full production feasibility on Midnight Mainnet:
- **Lightweight On-Chain Footprint**: Storage is limited to a 32-byte Merkle root and 32-byte nullifiers, keeping on-chain state minimal and gas costs extremely low.
- **Client-Side ZK Proving**: Proof generation is executed inside the user's browser via WASM and the 1AM / Lace Wallet extensions, offloading compute from validators.
- **Modular Integration**: GateKeep can act as a reusable privacy primitive middleware for any Web3 community or dApp infrastructure on Midnight.
- **Level 6 Roadmap**: Migration to Mainnet involves deploying finalized Compact circuits to Midnight Mainnet, conducting formal circuit audits, and integrating 1AM Wallet Mainnet RPC connectors.
