import { ApiPromise, WsProvider } from "@polkadot/api";
import { Abi, ContractPromise } from "@polkadot/api-contract";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { KeyringPair } from "@polkadot/keyring/types";
import { BN, BN_ONE } from "@polkadot/util";
import abi from "./daosign_app.json";
import type { WeightV2 } from "@polkadot/types/interfaces";
import {
  ProofOfAgreementVariables,
  ProofOfAuthorityVariables,
  ProofOfSignatureVariables,
} from "./proofTypes";

export class DaosignPolkadotContractInteractor {
  private readonly wsProvider: WsProvider;
  private readonly address: string;
  private readonly abi: any;

  constructor(address: string, providerUrl = "wss://ws.test.azero.dev") {
    this.wsProvider = new WsProvider(providerUrl);
    this.address = address;
    this.abi = abi;
  }

  public storeProofOfAuthority(wallet: KeyringPair, params: ProofOfAuthorityVariables) {
    const signers = params.message.signers.map((signer) => ({
      ...signer,
      addr: this.hexStringToArray(signer.addr, 32),
    }));
    return this.sendTransaction(wallet, "storeProofOfAuthority", {
      message: {
        name: "Proof-of-Authority",
        from: this.hexStringToArray(params.message.from, 32),
        agreementCid: params.message.agreementCID,
        signers: signers,
        timestamp: this.numberToArray(params.message.timestamp),
        metadata: params.message.metadata,
      },
      proofCid: params.proofCID,
      signature: this.hexStringToArray(params.signature),
    });
  }

  public storeProofOfSignature(wallet: KeyringPair, params: ProofOfSignatureVariables) {
    return this.sendTransaction(wallet, "storeProofOfSignature", {
      message: {
        name: "Proof-of-Signature",
        signer: this.hexStringToArray(params.message.signer, 32),
        authorityCid: params.message.authorityCID,
        timestamp: this.numberToArray(params.message.timestamp),
        metadata: params.message.metadata,
      },
      proofCid: params.proofCID,
      signature: this.hexStringToArray(params.signature),
    });
  }

  public storeProofOfAgreement(wallet: KeyringPair, params: ProofOfAgreementVariables) {
    return this.sendTransaction(wallet, "storeProofOfAgreement", {
      message: {
        metadata: params.message.metadata,
        timestamp: this.numberToArray(params.message.timestamp),
        authorityCid: params.message.authorityCID,
        signatureCids: params.message.signatureCIDs,
      },
      proofCid: params.proofCID,
    });
  }

  public async connectWallet(accountSeed: string, hdPath?: string) {
    await cryptoWaitReady();

    const keyring = new Keyring({ type: "sr25519" });
    return keyring.addFromUri(`${accountSeed}${hdPath || ""}`);
  }

  public async sendTransaction<T>(account: KeyringPair, methodName: string, params: T): Promise<string> {
    const api = await ApiPromise.create({ provider: this.wsProvider });
    const abi = new Abi(this.abi, api.registry.getChainProperties());
    const contract = new ContractPromise(api, abi, this.address);
    const MAX_CALL_WEIGHT = new BN(5_000_000_000_000).isub(BN_ONE);
    const PROOFSIZE = new BN(1_000_000);

    const storageDepositLimit = null;

    const { gasRequired, result, output } = await contract.query[methodName](
      account.address,
      {
        gasLimit: api?.registry.createType("WeightV2", {
          refTime: MAX_CALL_WEIGHT,
          proofSize: PROOFSIZE,
        }) as WeightV2,
        storageDepositLimit,
      },
      params
    );

    if (result.isErr) {
      throw new Error("Transaction failed");
    }

    const gasLimit = api?.registry.createType("WeightV2", gasRequired) as WeightV2;

    const tx = await contract.tx[methodName](
      {
        gasLimit,
        storageDepositLimit,
      },
      params
    );

    return new Promise<string>((resolve, reject) => {
      tx.signAndSend(account, (result) => {
        if (result.status.isInBlock) {
          console.log("Transaction included in block");
        } else if (result.status.isFinalized) {
          console.log("Transaction finalized");
          api.disconnect();
          resolve(result.txHash.toHex());
        }
      }).catch(reject);
    });
  }

  async getAccountBalance(address: string) {
    const api = await ApiPromise.create({ provider: this.wsProvider });

    //@ts-ignore
    const { data: { free: freeBalance } } = await api.query.system.account(address);

    await api.disconnect();

    return freeBalance.toString();
  }

  hexStringToArray(hexString: any, totalLength = 0) {
    const byteArray = Array.from(hexString.slice(2).match(/.{1,2}/g), (byte: string) => parseInt(byte, 16));
    const paddingSize = Math.max(totalLength - byteArray.length, 0);
    return Array(paddingSize).fill(0).concat(byteArray);
  }

  numberToArray(number) {
    if (number < 0) {
      throw new Error("Number is out of range");
    }

    if (!Number.isSafeInteger(number)) {
      throw new Error("Number is out of range");
    }

    const size = number === 0 ? 0 : Math.ceil((Math.floor(Math.log2(number)) + 1) / 8);
    const bytes = new Uint8ClampedArray(size);
    let x = number;
    for (let i = (size - 1); i >= 0; i--) {
      const rightByte = x & 0xff;
      bytes[i] = rightByte;
      x = Math.floor(x / 0x100);
    }

    return new Array(32 - bytes.length).fill(0).concat(Array.from(bytes));
  }
}
