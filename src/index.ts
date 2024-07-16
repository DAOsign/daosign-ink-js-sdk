import { ApiPromise, WsProvider } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import {KeyringPair} from "@polkadot/keyring/types";
import {ProofOfAgreementVariables, ProofOfAuthorityVariables, ProofOfSignatureVariables} from "./proofTypes";

export class DaosignPolkadotContractInteractor {
  private readonly wsProvider: WsProvider;
  private readonly address: string;
  private readonly abi: any;

  constructor(providerUrl: string, address: string, abi: any) {
    this.wsProvider = new WsProvider('wss://rococo-contracts-rpc.polkadot.io');
    this.address = address;
    this.abi = abi;
  }

  public storeProofOfAuthority(wallet: KeyringPair, params: ProofOfAuthorityVariables) {
    return this.sendTransaction(wallet, "storeProofOfAuthority", [params]);
  }

  public storeProofOfSignature(wallet: KeyringPair, params: ProofOfSignatureVariables) {
    return this.sendTransaction(wallet, "storeProofOfSignature", [params]);
  }

  public storeProofOfAgreement(wallet: KeyringPair, params: ProofOfAgreementVariables) {
    return this.sendTransaction(wallet, "storeProofOfAgreement", [params]);
  }

  public connectWallet(accountSeed: string) {
    const keyring = new Keyring({ type: 'sr25519' });
    return keyring.addFromUri(accountSeed);
  }

  private async sendTransaction<T>(account: KeyringPair, methodName: string, params: T[]): Promise<unknown> {
    await cryptoWaitReady();
    const api = await ApiPromise.create({ provider: this.wsProvider })
    const abi = new Abi(this.abi, api.registry.getChainProperties())
    const contract = new ContractPromise(api, abi, this.address)

    const { gasRequired, storageDeposit } = await contract.query[methodName](account.address, {}, ...params);

    const tx = await contract.tx[methodName]({
      gasLimit: gasRequired,
      storageDepositLimit: storageDeposit.asCharge
    }, ...params);

    return new Promise((resolve, reject) => {
      tx.signAndSend(account, (result) => {
        if (result.status.isFinalized) {
          resolve(result.txHash.toHex());
        }
      }).catch(reject);
    });
  }
}
