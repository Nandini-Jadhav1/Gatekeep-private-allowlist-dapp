# GateKeep Contract Deployment Instructions

## Summary

I've created `scripts/deploy.ts` that will deploy your compiled GateKeep contract to Midnight Preprod testnet. The script is ready to run, but there are some important considerations about the wallet provider implementation.

## Prerequisites

✅ **Already Verified:**
- WSL2/Ubuntu is healthy (Node v18.20.4, npm 10.9.8)
- Contract is compiled at `managed/GateKeep/`
- All necessary npm packages are installed
- `ws` package is already available (v8.21.3)

⚠️ **You Need to Verify:**
- Proof server is running on localhost:6300
- You have a funded Midnight wallet with tDUST tokens

## Before Running

### Step 1: Set Your Wallet Seed

**IMPORTANT:** You must set the `WALLET_SEED` environment variable with your actual wallet seed (as a hex string).

```bash
cd "/mnt/c/Users/Tuf/OneDrive/Desktop/Private Allowlist Access dApp"
export WALLET_SEED="your-wallet-seed-hex-here"
```

**DO NOT share your seed with anyone, including me or Claude.**

### Step 2: Verify Proof Server

Check if your Docker proof server is running:

```bash
# From PowerShell (not WSL):
docker ps --filter name=midnight-proof-server
```

If it's not running, start it before deploying.

### Step 3: Get Test Tokens

If you haven't already:
1. Get tNIGHT from: https://faucet.midnight.network
2. Convert some tNIGHT to tDUST (deployment requires tDUST for fees)

## Running the Deployment

Once `WALLET_SEED` is set:

```bash
cd "/mnt/c/Users/Tuf/OneDrive/Desktop/Private Allowlist Access dApp"
npx tsx scripts/deploy.ts
```

## Expected Output

If successful, you'll see:

```
✅ CONTRACT DEPLOYED SUCCESSFULLY!

======================================================================
Contract Address: 0x...
Transaction ID: ...
Block Height: ...
======================================================================

🔍 View on Explorer:
   https://preprod.midnightexplorer.com/contracts/0x...

📝 Update your README.md with this contract address.
```

## Known Limitations

⚠️ **Wallet Provider Implementation:**

The current deployment script uses a **simplified WalletProvider** implementation. This works for basic contract deployment but has limitations:

- `balanceTx()` is a placeholder that doesn't actually balance transactions with UTXOs
- For GateKeep's deployment (which doesn't transfer initial funds), this should work
- If deployment fails with balance-related errors, you'll need a full wallet provider implementation

### If You Encounter Wallet Errors

If you get errors related to transaction balancing or wallet operations, you have two options:

1. **Use Midnight CLI tools** (if available) for deployment instead
2. **Implement a full wallet provider** - this requires:
   - Fetching unshielded UTXOs from the indexer
   - Properly calculating inputs/outputs
   - Signing transactions with the wallet keys
   - This is complex and beyond the current scope

## Troubleshooting

### Error: "Proof server not accessible"
- Check Docker: `docker ps`
- Verify port 6300 is accessible from WSL
- Try: `curl http://localhost:6300`

### Error: "Insufficient tDUST"
- Visit https://faucet.midnight.network
- Request tNIGHT tokens
- Convert some to tDUST using the Midnight wallet UI

### Error: "Network connectivity"
- Verify you can reach Preprod:
  ```bash
  curl https://indexer.preprod.midnight.network/api/v4/graphql
  ```

### Error: "Cannot find module"
- The script uses `../managed/GateKeep/index.js`
- Verify the compiled contract exists:
  ```bash
  ls -la managed/GateKeep/
  ```

## After Successful Deployment

1. Copy the contract address from the output
2. Update `README.md` - replace the placeholder address
3. Update `VERIFICATION.md` - remove "(not deployed)" language
4. Test the deployed contract with your frontend

## Alternative: Manual Deployment via Midnight CLI

If the TypeScript deployment doesn't work due to wallet provider limitations, you can use Midnight's CLI tools (if installed):

```bash
compact deploy managed/GateKeep --network preprod
```

This would use Midnight's built-in wallet management.

---

**Ready to deploy?** Just set `WALLET_SEED` and run the script. Let me know what happens!
