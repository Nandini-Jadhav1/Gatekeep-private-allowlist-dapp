import { describe, it, expect, beforeEach } from 'vitest';
import { GateKeepClient } from '../src/contract.js';

describe('Private Allowlist Compact Circuit & Contract Tests', () => {
  let client: GateKeepClient;
  const organizerSecret = 'organizer-master-key-999';
  const secretResource = 'https://discord.gg/invite/private-vip-midnight-gatekeep-2026';
  const validMemberSecret = 'member-invite-code-secret-42';
  const validMemberSalt = 'member-salt-98765';

  beforeEach(async () => {
    client = new GateKeepClient();
    await client.initialize(organizerSecret, secretResource);
  });

  // Test 1: Circuit Logic
  it('should correctly compute zero-knowledge commitment and nullifier', async () => {
    const commitmentHex = await client.addMember(organizerSecret, validMemberSecret, validMemberSalt);
    expect(commitmentHex).toBeDefined();
    expect(commitmentHex.length).toBe(64);

    const result = await client.verifyAccess(validMemberSecret, validMemberSalt);
    expect(result.success).toBe(true);
    expect(result.nullifierHex).toBeDefined();
    expect(result.nullifierHex.length).toBe(64);
    expect(result.unlockedResource).toBe(secretResource);
  });

  // Test 2: State Transition
  it('should update on-chain nullifier set upon successful ZK proof verification', async () => {
    const initialState = client.getLedgerState();
    expect(initialState.verificationCount).toBe(0);
    expect(initialState.usedNullifiersCount).toBe(0);

    await client.addMember(organizerSecret, validMemberSecret, validMemberSalt);
    const result = await client.verifyAccess(validMemberSecret, validMemberSalt);

    expect(result.success).toBe(true);
    const newState = client.getLedgerState();
    expect(newState.verificationCount).toBe(1);
    expect(newState.usedNullifiersCount).toBe(1);
  });

  // Test 3: Privacy Assurance
  it('should ensure private user key/witness remains undisclosed on-chain', async () => {
    await client.addMember(organizerSecret, validMemberSecret, validMemberSalt);
    const result = await client.verifyAccess(validMemberSecret, validMemberSalt);

    const publicLedgerState = client.getLedgerState();

    // Verify public ledger only contains root & nullifiers, not private member secrets/salts
    expect(publicLedgerState).not.toHaveProperty('memberSecret');
    expect(publicLedgerState).not.toHaveProperty('memberSalt');
    expect(publicLedgerState).toHaveProperty('commitmentRootHex');
    expect(publicLedgerState).toHaveProperty('usedNullifiersCount');

    // Verify public nullifier hash is unlinkable to member secret string
    expect(result.nullifierHex).not.toContain(validMemberSecret);
  });
});
