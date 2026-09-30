#!/usr/bin/env tsx
// Run with: npx tsx scripts/deploy.ts
// Requires WALLET_SEED set in your environment first

import dns from 'node:dns';
// Force Node.js to prioritize IPv4 over IPv6 (fixes WSL / Windows network connection hangs)
dns.setDefaultResultOrder('ipv4first');

import WebSocket from 'ws';
// @ts-ignore
globalThis.WebSocket = WebSocket;

import { WalletBuilder } from '@midnight-ntwrk/wallet';
import { NetworkId } from '@midnight-ntwrk/zswap';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { nativeToken } from '@midnight-ntwrk/ledger';
import * as Rx from 'rxjs';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { Contract } from '../managed/GateKeep/contract/index.js';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'path';

// Working Midnight Preprod Endpoint Configurations
const PREPROD_CONFIG = {
  indexer: 'https://indexer.preprod.midnight.network/api/v1/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v1/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
  explorerBaseUrl: 'https://preprod.midnightexplorer.com',
};

async function main() {
  console.log('=== GateKeep Contract Deployment to Midnight Preprod ===\n');

  const seed = process.env.WALLET_SEED;
  if (!seed) {
    console.error('ERROR: WALLET_SEED is not set.');
    console.error('Run: npx tsx scripts/seed.ts');
    console.error('Then copy/run the export line it gives you, in this same terminal.');
    process.exit(1);
  }

  setNetworkId('preprod');

  console.log('Building wallet from seed and connecting to Preprod...');
  const wallet = await WalletBuilder.build(
    PREPROD_CONFIG.indexer,
    PREPROD_CONFIG.indexerWS,
    PREPROD_CONFIG.proofServer,
    PREPROD_CONFIG.node,
    seed,
    NetworkId.TestNet,
    'warn',
  );
  wallet.start();

  console.log('Waiting for wallet to sync (can take a few minutes)...');
  
  // Timeout safeguard added so the script gives explicit diagnostic feedback instead of hanging indefinitely
  const state: any = await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.filter((s: any) => s.syncProgress?.synced === true),
      Rx.timeout({
        first: 45000,
        with: () => {
          throw new Error('Connection timed out while syncing with Midnight Preprod. Network or RPC endpoint unreachable.');
        }
      })
    )
  );

  const address = state.address;
  const nightBalance = state.balances[nativeToken()] ?? 0n;
  console.log(`\nWallet address: ${address}`);
  console.log(`tNIGHT balance: ${nightBalance}`);

  if (nightBalance === 0n) {
    console.warn(
      '\nWARNING: 0 balance via this connection. If your wallet shows funds\n' +
        'but this shows 0, verify your WALLET_SEED before proceeding.\n',
    );
  }

  const zkConfigDir = path.resolve(process.cwd(), 'managed/GateKeep');
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigDir);

  const providers: any = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'gatekeep-private-state',
      privateStoragePasswordProvider: () => 'GateKeep-Deploy-Password-2026!',
      accountId: address,
    } as any),
    publicDataProvider: indexerPublicDataProvider(PREPROD_CONFIG.indexer, PREPROD_CONFIG.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PREPROD_CONFIG.proofServer, zkConfigProvider),
    walletProvider: {
      coinPublicKey: state.coinPublicKey,
      encryptionPublicKey: state.encryptionPublicKey,
      balanceTx: (tx: any, newCoins: any) => wallet.balanceTransaction(tx, newCoins),
    },
    midnightProvider: {
      submitTx: (tx: any) => wallet.submitTransaction(tx),
    },
  };

  const compiledContract = CompiledContract.withCompiledFileAssets(
    CompiledContract.withWitnesses(CompiledContract.make('GateKeep', Contract), {}),
    zkConfigDir,
  );

  console.log('\nDeploying GateKeep contract (this can take a minute or two)...');
  try {
    const deployed: any = await deployContract(providers, {
      compiledContract: compiledContract as any,
    } as any);

    const contractAddress = deployed.deployTxData.public.contractAddress;
    console.log('\n=== DEPLOYED SUCCESSFULLY ===');
    console.log(`Contract address: ${contractAddress}`);
    console.log(`View on explorer: ${PREPROD_CONFIG.explorerBaseUrl}/contracts/${contractAddress}`);
  } catch (err) {
    console.error('\nDeployment failed:');
    console.error(err);
    process.exit(1);
  } finally {
    await wallet.close();
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});