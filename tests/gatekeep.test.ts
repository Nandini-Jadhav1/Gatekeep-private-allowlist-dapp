import { describe, it, expect, beforeEach } from 'vitest';
import { GateKeepClient } from '../src/contract.js';

describe('GateKeep Compact Smart Contract & ZK Circuit Test Suite', () => {
  let client: GateKeepClient;
  const organizerSecret = 'organizer-master-key-999';
  const secretResource = 'https://discord.gg/invite/private-vip-midnight-gatekeep-2026';
  
  const validMemberSecret = 'member-invite-code-secret-42';
  const validMemberSalt = 'member-salt-98765';

  beforeEach(async () => {
    client = new GateKeepClient();
    await client.initialize(organizerSecret, secretResource);
  });

  it('1. Valid member successfully proves membership and gets gated access', async () => {
    // Organizer adds valid member commitment
    await client.addMember(organizerSecret, validMemberSecret, validMemberSalt);
    const stateAfterAdd = client.getLedgerState();
    expect(stateAfterAdd.memberCount).toBe(1);

    // Member proves access
    const result = await client.verifyAccess(validMemberSecret, validMemberSalt);
    expect(result.success).toBe(true);
    expect(result.unlockedResource).toBe(secretResource);
    expect(result.nullifierHex).toBeDefined();
    expect(result.nullifierHex.length).toBe(64);

    const stateAfterVerify = client.getLedgerState();
    expect(stateAfterVerify.verificationCount).toBe(1);
    expect(stateAfterVerify.usedNullifiersCount).toBe(1);
  });

  it('2. Non-member with invalid secret or un-allowlisted witness is rejected', async () => {
    await client.addMember(organizerSecret, validMemberSecret, validMemberSalt);

    const nonMemberSecret = 'unauthorized-hacker-secret-999';
    const nonMemberSalt = 'unauthorized-salt-999';

    await expect(
      client.verifyAccess(nonMemberSecret, nonMemberSalt)
    ).rejects.toThrow('Membership verification failed: Commitment not found in allowlist root');
  });

  it('3. Valid member attempting to reuse nullifier a second time is rejected (double-access prevention)', async () => {
    await client.addMember(organizerSecret, validMemberSecret, validMemberSalt);

    // First attempt succeeds
    const firstAttempt = await client.verifyAccess(validMemberSecret, validMemberSalt);
    expect(firstAttempt.success).toBe(true);

    // Second attempt with exact same nullifier fails
    await expect(
      client.verifyAccess(validMemberSecret, validMemberSalt)
    ).rejects.toThrow('Double access rejected: Nullifier has already been claimed');

    const state = client.getLedgerState();
    expect(state.verificationCount).toBe(1);
    expect(state.usedNullifiersCount).toBe(1);
  });

  it('4. Organizer-only access control rejects unauthorized callers trying to add members', async () => {
    const wrongOrganizerSecret = 'hacker-fake-organizer-secret';
    const fakeMemberSecret = 'fake-member-secret-111';
    const fakeMemberSalt = 'fake-member-salt-222';

    await expect(
      client.addMember(wrongOrganizerSecret, fakeMemberSecret, fakeMemberSalt)
    ).rejects.toThrow('Unauthorized: caller is not contract organizer');

    const state = client.getLedgerState();
    expect(state.memberCount).toBe(0);
  });

  it('5. Public counters increment correctly and commitment root updates', async () => {
    const state0 = client.getLedgerState();
    expect(state0.memberCount).toBe(0);
    expect(state0.verificationCount).toBe(0);

    // Add member 1
    await client.addMember(organizerSecret, 'member-1-secret', 'member-1-salt');
    const state1 = client.getLedgerState();
    expect(state1.memberCount).toBe(1);
    expect(state1.commitmentRootHex).not.toBe('0'.repeat(64));

    // Add member 2
    await client.addMember(organizerSecret, 'member-2-secret', 'member-2-salt');
    const state2 = client.getLedgerState();
    expect(state2.memberCount).toBe(2);

    // Member 1 verifies
    await client.verifyAccess('member-1-secret', 'member-1-salt');
    // Member 2 verifies
    await client.verifyAccess('member-2-secret', 'member-2-salt');

    const stateFinal = client.getLedgerState();
    expect(stateFinal.verificationCount).toBe(2);
    expect(stateFinal.usedNullifiersCount).toBe(2);
  });
});
