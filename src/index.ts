import { ApiPromise, WsProvider } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import {KeyringPair} from "@polkadot/keyring/types";
import {ProofOfAgreementVariables, ProofOfAuthorityVariables, ProofOfSignatureVariables} from "./proofTypes";

class DaosignPolkadotContractInteractor {
  private api: ApiPromise;
  private contract: ContractPromise;
  private address: string;
  private readonly abi: Abi;

  constructor(api: ApiPromise, address: string, abi: any) {
    this.api = api;
    this.address = address;
    this.abi = new Abi(abi, api.registry.getChainProperties());
    this.contract = new ContractPromise(api, this.abi, address);
  }

  public storeProofOfAuthority(wallet: KeyringPair, params: ProofOfAuthorityVariables){
    return this.sendTransaction(wallet, "storeProofOfAuthority", params);
  }

  public storeProofOfSignature(wallet: KeyringPair, params: ProofOfSignatureVariables){
    return this.sendTransaction(wallet, "storeProofOfSignature", params);
  }

  public storeProofOfAgreement(wallet: KeyringPair, params: ProofOfAgreementVariables){
    return this.sendTransaction(wallet, "storeProofOfAgreement", params);
  }

  public connectWallet(accountSeed: string) {
    const keyring = new Keyring({ type: 'sr25519' });
    return keyring.addFromUri(accountSeed);
  }

  private async sendTransaction<T>(account: KeyringPair, methodName: string, params: T): Promise<unknown> {
    await cryptoWaitReady();

    const { gasRequired, storageDeposit } = await this.contract.query[methodName](account.address, {}, ...params);

    const tx = await this.contract.tx[methodName]({
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
