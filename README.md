# Daosign Polkadot JS SDK


JS/Typescript SDK for DaoSign [Polkadot smart contracts](https://github.com/DAOsign/polkadot-smart-contracts). It allows to store Proof of Authority, Proof of Signature, and Proof of Agreement data on the smart contract.

## Installation

```shell
npm install @daosign/polkadot
```

## Example of usage


```typescript
import { DaosignPolkadotContractInteractor } from "@daosign/polkadot";

const contractAddress = "YOUR_CONTRACT_ADDRESS";
const providerUrl = "wss://YOUR_POLKADOT_NODE_URL"; // Optional, defaults to "wss://ws.test.azero.dev"
const accountSeed = "YOUR_ACCOUNT_SEED"; // Replace with your seed phrase

const daosign = new DaosignPolkadotContractInteractor(contractAddress, providerUrl);
const wallet = await daosign.connectWallet(accountSeed);

// Example: Store Proof of Authority
const proofOfAuthority = { /* ... your Proof of Authority data ... */ };
const transactionHash = await daosign.storeProofOfAuthority(wallet, proofOfAuthority);
console.log("Transaction hash:", transactionHash);

```

## Testing

Run following command to execute unit tests:

```shell
npm install
npm run test
```

You should see output likt that:

```
> @daosign/polkadot@1.0.0 test
> jest

 PASS  __tests__/DaosignPolkadotContractInteractor.test.ts (6.783 s)
  DaosignPolkadotContractInteractor
    ✓ should get account balance successfully (27 ms)
    ✓ should throw an error if account balance retrieval fails (12 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        6.848 s
Ran all test suites.
```