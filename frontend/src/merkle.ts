/**
 * Utility functions for commitment derivation and nullifier generation
 * in the GateKeep reference simulator.
 * 
 * NOTE: These functions use a simple FNV-1a-based hash for local simulation only.
 * This is NOT cryptographically secure and NOT the hash used by the real Compact
 * circuit (which uses persistent_hash as defined in CompactStandardLibrary).
 */

function fnv1a(data: Uint8Array): Uint8Array {
  // Placeholder hash for local simulation only — NOT cryptographically secure, NOT the hash used by the real Compact circuit (persistent_hash)
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

export function sha256(data: Uint8Array | string): Uint8Array {
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = data;
  }
  return fnv1a(bytes);
}

export function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Derive member commitment hash from secret and salt:
 * commitment = sha256(secret || salt)
 */
export function deriveCommitment(secret: string, salt: string): Uint8Array {
  const secretBytes = sha256(secret);
  const saltBytes = sha256(salt);
  const combined = new Uint8Array(64);
  combined.set(secretBytes, 0);
  combined.set(saltBytes, 32);
  return sha256(combined);
}

/**
 * Derive unique nullifier for access verification:
 * nullifier = sha256(secretBytes || domainSeparatorBytes)
 */
export function deriveNullifier(secret: string, domainSeparator: string = 'GATEKEEP_ACCESS_V1'): Uint8Array {
  const secretBytes = sha256(secret);
  const domainBytes = sha256(domainSeparator);
  const combined = new Uint8Array(64);
  combined.set(secretBytes, 0);
  combined.set(domainBytes, 32);
  return sha256(combined);
}

/**
 * Generate organizer key pair hashes from secret string
 */
export function deriveOrganizerKey(organizerSecret: string): { secretBytes: Uint8Array; publicKeyBytes: Uint8Array } {
  const secretBytes = sha256(organizerSecret);
  const publicKeyBytes = sha256(secretBytes);
  return { secretBytes, publicKeyBytes };
}
