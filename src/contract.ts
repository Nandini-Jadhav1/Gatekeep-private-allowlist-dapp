import { GateKeepContract, GateKeepLedger, MemberWitness } from '../contracts/managed/GateKeep/index.js';
import { deriveCommitment, sha256, toHex } from './merkle.js';

export interface GateKeepState {
  organizerPublicKeyHex: string;
  allowedCommitmentsCount: number;
  usedNullifiersCount: number;
  memberCount: number;
  verificationCount: number;
  gatedResourceHashHex: string;
  commitmentRootHex: string;
}

export class GateKeepClient {
  private instance: GateKeepContract;
  public gatedResourcePayload: string = '';

  constructor() {
    this.instance = new GateKeepContract();
  }

  async initialize(organizerSecret: string, gatedResourcePayload: string): Promise<void> {
    const secretBytes = sha256(organizerSecret);
    const publicKeyBytes = sha256(secretBytes);
    const resourceHash = sha256(gatedResourcePayload);
    this.gatedResourcePayload = gatedResourcePayload;
    await this.instance.initialize(publicKeyBytes, resourceHash);
  }

  async addMember(organizerSecret: string, memberSecret: string, memberSalt: string): Promise<string> {
    const secretBytes = sha256(organizerSecret);
    const commitment = deriveCommitment(memberSecret, memberSalt);
    await this.instance.addMember(secretBytes, commitment);
    return toHex(commitment);
  }

  async verifyAccess(memberSecret: string, memberSalt: string, domainSeparator: string = 'GATEKEEP_ACCESS_V1'): Promise<{ success: boolean; nullifierHex: string; unlockedResource: string }> {
    const secretBytes = sha256(memberSecret);
    const saltBytes = sha256(memberSalt);
    const domainBytes = sha256(domainSeparator);

    const witness: MemberWitness = {
      secret: secretBytes,
      salt: saltBytes,
    };

    const nullifierBytes = await this.instance.verifyAccess(witness, domainBytes);
    const nullifierHex = toHex(nullifierBytes);

    return {
      success: true,
      nullifierHex,
      unlockedResource: this.gatedResourcePayload,
    };
  }

  getLedgerState(): GateKeepState {
    const ledger: GateKeepLedger = this.instance.ledger;
    const firstCommitment = Array.from(ledger.allowedCommitments)[0] || '0000000000000000000000000000000000000000000000000000000000000000';
    return {
      organizerPublicKeyHex: toHex(ledger.organizerPublicKey),
      allowedCommitmentsCount: ledger.allowedCommitments.size,
      usedNullifiersCount: ledger.usedNullifiers.size,
      memberCount: Number(ledger.memberCount),
      verificationCount: Number(ledger.verificationCount),
      gatedResourceHashHex: toHex(ledger.gatedResourceHash),
      commitmentRootHex: firstCommitment,
    };
  }
}
