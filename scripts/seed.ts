// Run this LOCALLY ONLY: npx tsx scripts/seed.ts
// Converts your recovery phrase to the seed format @midnight-ntwrk/wallet expects.
// Runs entirely on your machine — makes no network calls.

import { createInterface } from 'readline';
import { validateMnemonic, mnemonicToEntropy } from 'bip39';

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste your recovery phrase, then press Enter: ', (phrase) => {
  rl.close();
  const cleaned = phrase.trim();

  if (!validateMnemonic(cleaned)) {
    console.error('\nThat does not look like a valid recovery phrase. Check for typos/extra spaces and try again.');
    process.exit(1);
  }

  const hex = mnemonicToEntropy(cleaned);

  console.log('\nYour wallet seed (copy the export line below):\n');
  console.log(`export WALLET_SEED="${hex}"`);
  console.log('\nRun that line now, in this SAME terminal, then run: npx tsx scripts/deploy.ts\n');
  console.log('NOTE: if deploy.ts says the seed derives a DIFFERENT address than your funded wallet,');
  console.log('tell me — Midnight\'s exact seed format has changed between SDK versions and we may');
  console.log('need to try the alternative (mnemonicToSeedSync) instead.');
});