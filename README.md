# Daosign Polkadot JS SDK


JS/Typescript SDK for DaoSign [Polkadot smart contracts](https://github.com/DAOsign/polkadot-smart-contracts). It allows to store Proof of Authority, Proof of Signature, and Proof of Agreement data on the smart contract.

## Installation

```bash
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

