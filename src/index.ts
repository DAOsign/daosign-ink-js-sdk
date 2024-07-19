import { ApiPromise, WsProvider } from '@polkadot/api';
import { Abi, ContractPromise } from '@polkadot/api-contract';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { KeyringPair } from "@polkadot/keyring/types";
import { ProofOfAgreementVariables, ProofOfAuthorityVariables, ProofOfSignatureVariables } from "./proofTypes";

export class DaosignPolkadotContractInteractor {
  private readonly wsProvider: WsProvider;
  private readonly address: string;
  private readonly abi: any;

  constructor(address: string, abi: any, providerUrl = 'wss://rococo-contracts-rpc.polkadot.io') {
    this.wsProvider = new WsProvider(providerUrl);
    this.address = address;
    this.abi = abi;
  }

  public storeProofOfAuthority(wallet: KeyringPair, params: ProofOfAuthorityVariables) {
    const signers = params.message.signers.map((signer) => { return { ...signer, addr: this.to32ByteHex(signer.addr) } })
    return this.sendTransaction(wallet, "storeProofOfAuthority", [{ ...params, message: { ...params.message, signers, from: this.to32ByteHex(params.message.from), timestamp: this.numberTo32ByteArray(params.message.timestamp) } }]);
  }

  public storeProofOfSignature(wallet: KeyringPair, params: ProofOfSignatureVariables) {
    return this.sendTransaction(wallet, "storeProofOfSignature", [{ ...params, message: { ...params.message, signer: this.to32ByteHex(params.message.signer), timestamp: this.numberTo32ByteArray(params.message.timestamp) } }]);
  }

  public storeProofOfAgreement(wallet: KeyringPair, params: ProofOfAgreementVariables) {
    return this.sendTransaction(wallet, "storeProofOfAgreement", [{ ...params, message: { ...params.message, timestamp: this.numberTo32ByteArray(params.message.timestamp) } }]);
  }

  public async connectWallet(accountSeed: string, hdPath?: string) {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: 'sr25519' });
    return keyring.addFromUri(`${accountSeed}${hdPath || ""}`);
  }

  private async sendTransaction<T>(account: KeyringPair, methodName: string, params: T[]): Promise<string> {
    const api = await ApiPromise.create({ provider: this.wsProvider })
    const abi = new Abi(this.abi, api.registry.getChainProperties())
    const contract = new ContractPromise(api, abi, this.address)

    const { gasRequired, storageDeposit } = await contract.query[methodName](account.address, {}, ...params);

    const tx = await contract.tx[methodName]({
      gasLimit: gasRequired,
      storageDepositLimit: storageDeposit.asCharge
    }, ...params);

    return new Promise<string>((resolve, reject) => {
      tx.signAndSend(account, (result) => {
        if (result.status.isInBlock) {
          console.log('Transaction included in block');
        } else if (result.status.isFinalized) {
          console.log('Transaction finalized');
          api.disconnect();
          resolve(result.txHash.toHex());
        }
      }).catch(reject);
    });
  }

  private to32ByteHex(hex: string): string {
    if (hex.startsWith('0x')) {
      hex = hex.slice(2);
    }
    return '0x' + hex.padStart(64, '0');
  }

  private numberTo32ByteArray(num: number): string {
    const hex = num.toString(16).padStart(64, '0');
    return '0x' + hex;
  }

  async getAccountBalance(address: string) {
    const api = await ApiPromise.create({ provider: this.wsProvider })

    //@ts-ignore
    const { data: { free: freeBalance } } = await api.query.system.account(address);

    await api.disconnect();

    return freeBalance.toNumber();
  }
}
