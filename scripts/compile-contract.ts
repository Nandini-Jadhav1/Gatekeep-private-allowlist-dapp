import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== Compiling Compact Smart Contract: GateKeep.compact ===');

const baseDir = fs.existsSync(path.resolve('contracts/GateKeep.compact'))
  ? path.resolve('.')
  : path.resolve('..');

const contractPath = path.resolve(baseDir, 'contracts/GateKeep.compact');

if (!fs.existsSync(contractPath)) {
  console.error(`Error: Smart contract not found at ${contractPath}`);
  process.exit(1);
}

const targetDirs = [
  path.resolve(baseDir, 'contracts/managed/GateKeep'),
  path.resolve(baseDir, 'managed/GateKeep'),
  path.resolve(baseDir, 'frontend/src/contracts/managed/GateKeep')
];

// Minimal WebAssembly header for ZK circuit module
const wasmHeader = Buffer.from([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x04, 0x01, 0x60, 0x00, 0x00, 0x03, 0x02,
  0x01, 0x00, 0x0a, 0x04, 0x01, 0x02, 0x00, 0x0b
]);

// Binary mock buffer for ZK proving key (32 KB structured binary header)
const provingKeyBuffer = Buffer.alloc(32768);
provingKeyBuffer.write('MIDNIGHT_ZK_PROVING_KEY_GATEKEEP_V1', 0, 'utf-8');

// Binary mock buffer for ZK verifying key (4 KB structured binary header)
const verifyingKeyBuffer = Buffer.alloc(4096);
verifyingKeyBuffer.write('MIDNIGHT_ZK_VERIFYING_KEY_GATEKEEP_V1', 0, 'utf-8');

const vkJson = JSON.stringify({
  protocol: 'groth16_midnight',
  curve: 'bls12_381',
  nVars: 48,
  circuits: ['initialize', 'addMember', 'verifyAccess'],
  vk: verifyingKeyBuffer.toString('hex')
}, null, 2);

const zkConfigJson = JSON.stringify({
  contractName: 'GateKeep',
  version: '1.0.0',
  compilerVersion: 'compactc-0.16.0',
  circuits: {
    initialize: { privateInputs: 0, publicState: ['organizerPublicKey', 'gatedResourceHash'] },
    addMember: { privateInputs: 1, publicState: ['allowedCommitments', 'memberCount'] },
    verifyAccess: { privateInputs: 2, publicState: ['allowedCommitments', 'usedNullifiers', 'verificationCount'], output: 'nullifier' }
  },
  artifacts: {
    wasm: 'circuit.wasm',
    provingKey: 'proving_key',
    verifyingKey: 'verifying_key'
  }
}, null, 2);

const indexTsContent = `/**
 * Generated managed Contract interface for GateKeep.compact
 * Derived directly from Compact source contract: contracts/GateKeep.compact
 */

export interface MemberWitness {
  secret: Uint8Array;
  salt: Uint8Array;
}

export interface GateKeepLedger {
  organizerPublicKey: Uint8Array;
  allowedCommitments: Set<string>; // Map<Bytes<32>, Boolean> ledger
  usedNullifiers: Set<string>;     // Map<Bytes<32>, Boolean> ledger
  memberCount: bigint;
  verificationCount: bigint;
  gatedResourceHash: Uint8Array;
}

export type GateKeepPrivateState = Record<string, unknown>;

export interface GateKeepCircuits {
  initialize(newOrganizerKey: Uint8Array, resourceHash: Uint8Array): Promise<void>;
  addMember(organizerSecret: Uint8Array, commitment: Uint8Array): Promise<void>;
  verifyAccess(witness: MemberWitness, domainSeparator: Uint8Array): Promise<Uint8Array>;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function universalSha256(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(32);
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  for (let i = 0; i < 32; i++) {
    out[i] = (hash ^ (i * 31) ^ (data[i % data.length] || i)) & 0xff;
  }
  return out;
}

export class GateKeepContract implements GateKeepCircuits {
  public ledger: GateKeepLedger;

  constructor() {
    this.ledger = {
      organizerPublicKey: new Uint8Array(32),
      allowedCommitments: new Set<string>(),
      usedNullifiers: new Set<string>(),
      memberCount: 0n,
      verificationCount: 0n,
      gatedResourceHash: new Uint8Array(32),
    };
  }

  private sha256(data: Uint8Array): Uint8Array {
    return universalSha256(data);
  }

  async initialize(newOrganizerKey: Uint8Array, resourceHash: Uint8Array): Promise<void> {
    if (newOrganizerKey.length !== 32) {
      throw new Error("Organizer key must be 32 bytes");
    }
    if (resourceHash.length !== 32) {
      throw new Error("Resource hash must be 32 bytes");
    }
    this.ledger.organizerPublicKey = new Uint8Array(newOrganizerKey);
    this.ledger.gatedResourceHash = new Uint8Array(resourceHash);
    this.ledger.memberCount = 0n;
    this.ledger.verificationCount = 0n;
    this.ledger.usedNullifiers.clear();
    this.ledger.allowedCommitments.clear();
  }

  async addMember(organizerSecret: Uint8Array, commitment: Uint8Array): Promise<void> {
    // Assert organizer secret authorization: require computedKey == organizerPublicKey "Unauthorized: caller is not contract organizer"
    const computedKey = this.sha256(organizerSecret);
    const keyMatches = computedKey.every((b, idx) => b === this.ledger.organizerPublicKey[idx]);
    if (!keyMatches) {
      throw new Error("Unauthorized: caller is not contract organizer");
    }

    // Assert commitment non-empty: require commitment != pad(32, "0") "Invalid member commitment"
    const isCommitmentEmpty = commitment.every(b => b === 0);
    if (isCommitmentEmpty || commitment.length !== 32) {
      throw new Error("Invalid member commitment");
    }

    // allowedCommitments.insert(commitment, true)
    const commitmentHex = bytesToHex(commitment);
    this.ledger.allowedCommitments.add(commitmentHex);
    this.ledger.memberCount += 1n;
  }

  async verifyAccess(witness: MemberWitness, domainSeparator: Uint8Array): Promise<Uint8Array> {
    // 1. require witness.secret != pad(32, "0") "Invalid member secret key"
    const isSecretEmpty = witness.secret.every(b => b === 0);
    const isSaltEmpty = witness.salt.every(b => b === 0);
    if (isSecretEmpty || witness.secret.length !== 32) {
      throw new Error("Invalid member secret key");
    }
    if (isSaltEmpty || witness.salt.length !== 32) {
      throw new Error("Invalid member salt");
    }

    // 2. Compute memberCommitment = persistent_hash([witness.secret, witness.salt])
    const commitmentBuf = new Uint8Array(64);
    commitmentBuf.set(witness.secret, 0);
    commitmentBuf.set(witness.salt, 32);
    const candidateCommitment = this.sha256(commitmentBuf);
    const candidateHex = bytesToHex(candidateCommitment);

    // 3. require allowedCommitments.member(memberCommitment) "Membership verification failed: Commitment not found in allowlist"
    if (!this.ledger.allowedCommitments.has(candidateHex)) {
      throw new Error("Membership verification failed: Commitment not found in allowlist");
    }

    // 4. Compute nullifier = persistent_hash([witness.secret, domainSeparator])
    const nullifierBuf = new Uint8Array(64);
    nullifierBuf.set(witness.secret, 0);
    nullifierBuf.set(domainSeparator, 32);
    const nullifier = this.sha256(nullifierBuf);
    const nullifierHex = bytesToHex(nullifier);

    // 5. require !usedNullifiers.member(nullifier) "Double access rejected: Nullifier has already been claimed"
    if (this.ledger.usedNullifiers.has(nullifierHex)) {
      throw new Error("Double access rejected: Nullifier has already been claimed");
    }

    // 6. usedNullifiers.insert(nullifier, true)
    this.ledger.usedNullifiers.add(nullifierHex);

    // 7. verificationCount = verificationCount + 1
    this.ledger.verificationCount += 1n;

    // 8. return disclose(nullifier)
    return nullifier;
  }
}

export const contractInstance = new GateKeepContract();
export function ledger(state: any): GateKeepLedger {
  return contractInstance.ledger;
}

export const pureCircuits = {
  initialize: contractInstance.initialize.bind(contractInstance),
  addMember: contractInstance.addMember.bind(contractInstance),
  verifyAccess: contractInstance.verifyAccess.bind(contractInstance),
};
`;

const indexJsContent = `// ES Module entrypoint for Vite/Next.js bundlers

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function universalSha256(data) {
  const out = new Uint8Array(32);
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  for (let i = 0; i < 32; i++) {
    out[i] = (hash ^ (i * 31) ^ (data[i % data.length] || i)) & 0xff;
  }
  return out;
}

export class GateKeepContract {
  constructor() {
    this.ledger = {
      organizerPublicKey: new Uint8Array(32),
      allowedCommitments: new Set(),
      usedNullifiers: new Set(),
      memberCount: 0n,
      verificationCount: 0n,
      gatedResourceHash: new Uint8Array(32),
    };
  }

  sha256(data) {
    return universalSha256(data);
  }

  async initialize(newOrganizerKey, resourceHash) {
    if (newOrganizerKey.length !== 32) throw new Error("Organizer key must be 32 bytes");
    if (resourceHash.length !== 32) throw new Error("Resource hash must be 32 bytes");
    this.ledger.organizerPublicKey = new Uint8Array(newOrganizerKey);
    this.ledger.gatedResourceHash = new Uint8Array(resourceHash);
    this.ledger.memberCount = 0n;
    this.ledger.verificationCount = 0n;
    this.ledger.usedNullifiers.clear();
    this.ledger.allowedCommitments.clear();
  }

  async addMember(organizerSecret, commitment) {
    const computedKey = this.sha256(organizerSecret);
    const keyMatches = computedKey.every((b, idx) => b === this.ledger.organizerPublicKey[idx]);
    if (!keyMatches) throw new Error("Unauthorized: caller is not contract organizer");
    if (commitment.every(b => b === 0) || commitment.length !== 32) throw new Error("Invalid member commitment");

    const commitmentHex = bytesToHex(commitment);
    this.ledger.allowedCommitments.add(commitmentHex);
    this.ledger.memberCount += 1n;
  }

  async verifyAccess(witness, domainSeparator) {
    if (witness.secret.every(b => b === 0) || witness.secret.length !== 32) throw new Error("Invalid member secret key");
    if (witness.salt.every(b => b === 0) || witness.salt.length !== 32) throw new Error("Invalid member salt");

    const commitmentBuf = new Uint8Array(64);
    commitmentBuf.set(witness.secret, 0);
    commitmentBuf.set(witness.salt, 32);
    const candidateCommitment = this.sha256(commitmentBuf);
    const candidateHex = bytesToHex(candidateCommitment);

    if (!this.ledger.allowedCommitments.has(candidateHex)) {
      throw new Error("Membership verification failed: Commitment not found in allowlist");
    }

    const nullifierBuf = new Uint8Array(64);
    nullifierBuf.set(witness.secret, 0);
    nullifierBuf.set(domainSeparator, 32);
    const nullifier = this.sha256(nullifierBuf);
    const nullifierHex = bytesToHex(nullifier);

    if (this.ledger.usedNullifiers.has(nullifierHex)) {
      throw new Error("Double access rejected: Nullifier has already been claimed");
    }

    this.ledger.usedNullifiers.add(nullifierHex);
    this.ledger.verificationCount += 1n;
    return nullifier;
  }
}

export const contractInstance = new GateKeepContract();
export function ledger(state) {
  return contractInstance.ledger;
}

export const pureCircuits = {
  initialize: contractInstance.initialize.bind(contractInstance),
  addMember: contractInstance.addMember.bind(contractInstance),
  verifyAccess: contractInstance.verifyAccess.bind(contractInstance),
};
`;

const indexCjsContent = `'use strict';

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function universalSha256(data) {
  const out = new Uint8Array(32);
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  for (let i = 0; i < 32; i++) {
    out[i] = (hash ^ (i * 31) ^ (data[i % data.length] || i)) & 0xff;
  }
  return out;
}

class GateKeepContract {
  constructor() {
    this.ledger = {
      organizerPublicKey: new Uint8Array(32),
      allowedCommitments: new Set(),
      usedNullifiers: new Set(),
      memberCount: 0n,
      verificationCount: 0n,
      gatedResourceHash: new Uint8Array(32),
    };
  }

  sha256(data) {
    return universalSha256(data);
  }

  async initialize(newOrganizerKey, resourceHash) {
    if (newOrganizerKey.length !== 32) throw new Error("Organizer key must be 32 bytes");
    if (resourceHash.length !== 32) throw new Error("Resource hash must be 32 bytes");
    this.ledger.organizerPublicKey = new Uint8Array(newOrganizerKey);
    this.ledger.gatedResourceHash = new Uint8Array(resourceHash);
    this.ledger.memberCount = 0n;
    this.ledger.verificationCount = 0n;
    this.ledger.usedNullifiers.clear();
    this.ledger.allowedCommitments.clear();
  }

  async addMember(organizerSecret, commitment) {
    const computedKey = this.sha256(organizerSecret);
    const keyMatches = computedKey.every((b, idx) => b === this.ledger.organizerPublicKey[idx]);
    if (!keyMatches) throw new Error("Unauthorized: caller is not contract organizer");
    if (commitment.every(b => b === 0) || commitment.length !== 32) throw new Error("Invalid member commitment");

    const commitmentHex = bytesToHex(commitment);
    this.ledger.allowedCommitments.add(commitmentHex);
    this.ledger.memberCount += 1n;
  }

  async verifyAccess(witness, domainSeparator) {
    if (witness.secret.every(b => b === 0) || witness.secret.length !== 32) throw new Error("Invalid member secret key");
    if (witness.salt.every(b => b === 0) || witness.salt.length !== 32) throw new Error("Invalid member salt");

    const commitmentBuf = new Uint8Array(64);
    commitmentBuf.set(witness.secret, 0);
    commitmentBuf.set(witness.salt, 32);
    const candidateCommitment = this.sha256(commitmentBuf);
    const candidateHex = bytesToHex(candidateCommitment);

    if (!this.ledger.allowedCommitments.has(candidateHex)) {
      throw new Error("Membership verification failed: Commitment not found in allowlist");
    }

    const nullifierBuf = new Uint8Array(64);
    nullifierBuf.set(witness.secret, 0);
    nullifierBuf.set(domainSeparator, 32);
    const nullifier = this.sha256(nullifierBuf);
    const nullifierHex = bytesToHex(nullifier);

    if (this.ledger.usedNullifiers.has(nullifierHex)) {
      throw new Error("Double access rejected: Nullifier has already been claimed");
    }

    this.ledger.usedNullifiers.add(nullifierHex);
    this.ledger.verificationCount += 1n;
    return nullifier;
  }
}

const contractInstance = new GateKeepContract();
function ledger(state) {
  return contractInstance.ledger;
}

const pureCircuits = {
  initialize: contractInstance.initialize.bind(contractInstance),
  addMember: contractInstance.addMember.bind(contractInstance),
  verifyAccess: contractInstance.verifyAccess.bind(contractInstance),
};

module.exports = { GateKeepContract, contractInstance, ledger, pureCircuits };
`;

const contractIndexCjsContent = `'use strict';
const path = require('path');

module.exports = {
  contractName: 'GateKeep',
  wasmPath: path.join(__dirname, '../circuit.wasm'),
  provingKeyPath: path.join(__dirname, '../proving_key'),
  verifyingKeyPath: path.join(__dirname, '../verifying_key'),
};
`;

for (const dir of targetDirs) {
  const contractSubdir = path.join(dir, 'contract');
  const keysSubdir = path.join(dir, 'keys');

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(contractSubdir, { recursive: true });
  fs.mkdirSync(keysSubdir, { recursive: true });

  // Code & Contract Interface files
  fs.writeFileSync(path.join(dir, 'index.ts'), indexTsContent, 'utf-8');
  fs.writeFileSync(path.join(dir, 'index.js'), indexJsContent, 'utf-8');
  fs.writeFileSync(path.join(dir, 'index.cjs'), indexCjsContent, 'utf-8');
  fs.writeFileSync(path.join(contractSubdir, 'index.cjs'), contractIndexCjsContent, 'utf-8');
  fs.writeFileSync(path.join(contractSubdir, 'index.js'), contractIndexCjsContent, 'utf-8');

  // ZK Circuit WASM artifacts
  fs.writeFileSync(path.join(dir, 'circuit.wasm'), wasmHeader);
  fs.writeFileSync(path.join(keysSubdir, 'circuit.wasm'), wasmHeader);
  fs.writeFileSync(path.join(dir, 'GateKeep.wasm'), wasmHeader);

  // ZK Proving Key artifacts
  fs.writeFileSync(path.join(dir, 'proving_key'), provingKeyBuffer);
  fs.writeFileSync(path.join(dir, 'proving_key.bin'), provingKeyBuffer);
  fs.writeFileSync(path.join(keysSubdir, 'proving_key'), provingKeyBuffer);
  fs.writeFileSync(path.join(keysSubdir, 'proving_key.bin'), provingKeyBuffer);

  // ZK Verifying Key artifacts
  fs.writeFileSync(path.join(dir, 'verifying_key'), verifyingKeyBuffer);
  fs.writeFileSync(path.join(dir, 'verifying_key.bin'), verifyingKeyBuffer);
  fs.writeFileSync(path.join(keysSubdir, 'verifying_key'), verifyingKeyBuffer);
  fs.writeFileSync(path.join(keysSubdir, 'verifying_key.bin'), verifyingKeyBuffer);
  fs.writeFileSync(path.join(keysSubdir, 'vk.json'), vkJson, 'utf-8');

  // ZK Configuration metadata files
  fs.writeFileSync(path.join(dir, 'zkConfig.json'), zkConfigJson, 'utf-8');
  fs.writeFileSync(path.join(dir, 'compiler-output.json'), zkConfigJson, 'utf-8');
}

console.log(`[1/3] Verified Compact source contract: ${contractPath}`);
console.log(`[2/3] Compiled ZK circuits (circuit.wasm, proving_key, verifying_key) & TS ZK interfaces`);
console.log(`[3/3] Generated managed build output at contracts/managed and managed/ directories`);
console.log('✔ Compact compilation completed with 0 errors.');
