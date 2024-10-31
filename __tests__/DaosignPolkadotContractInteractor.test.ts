import { DaosignPolkadotContractInteractor } from '../src';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { BN } from '@polkadot/util';
import { ProofOfAgreementVariables, ProofOfAuthorityVariables } from "../src/proofTypes";
import { ContractPromise } from "@polkadot/api-contract";

jest.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: jest.fn()
  },
  WsProvider: jest.fn()
}));

jest.mock('@polkadot/api-contract', () => ({
  Abi: jest.fn(),
  ContractPromise: jest.fn()
}));


describe("numberToArray", () => {
  let interactor: DaosignPolkadotContractInteractor;

  beforeEach(() => {
    interactor = new DaosignPolkadotContractInteractor("contract_address");
  });

  test("should correctly convert positive numbers", () => {
    expect(interactor.numberToArray(123)).toEqual(expect.any(Array));
  });

  test("should correctly handle zero", () => {
    expect(interactor.numberToArray(0)).toEqual(Array(32).fill(0));
  });

  test("should correctly convert large numbers", () => {
    const largeNumber = 2 ** 50;
    expect(interactor.numberToArray(largeNumber)).toEqual(expect.any(Array));
  });

  test("should throw an error for numbers exceeding maximum safe integer", () => {
    const largeUnsafeNumber = Number.MAX_SAFE_INTEGER + 1;
    expect(() => interactor.numberToArray(largeUnsafeNumber)).toThrow("Number is out of range");
  });

  test("should throw an error for negative numbers", () => {
    expect(() => interactor.numberToArray(-123)).toThrow("Number is out of range");
  });
});

describe("sendTransaction", () => {
  let interactor: DaosignPolkadotContractInteractor;
  let wallet: KeyringPair;
  const mockApi = {
    registry: {
      createType: jest.fn().mockReturnValue({}),
      getChainProperties: jest.fn()
    },
    disconnect: jest.fn()
  };

  const mockContract = {
    query: {
      storeProofOfAuthority: jest.fn()
    },
    tx: {
      storeProofOfAuthority: jest.fn()
    }
  };

  beforeEach(async () => {
    (ApiPromise.create as jest.Mock).mockResolvedValue(mockApi);
    (ContractPromise as jest.Mock).mockImplementation(() => mockContract);
    interactor = new DaosignPolkadotContractInteractor("contract_address");

    wallet = { address: "5F3sa2TJAWMqDhXG6jhV4N8ko9reG3gV1sfrZYJxynzVtqr4" } as KeyringPair;
  });

  test("should send a transaction successfully with valid parameters", async () => {
    mockContract.query.storeProofOfAuthority.mockResolvedValue({
      gasRequired: new BN(1000000), // Adjust as needed
      storageDepositLimit: new BN("07a120", 16),
      result: { isErr: false },
      output: {}
    });
    const mockTxHash = "0xmocktxhash";
    mockContract.tx.storeProofOfAuthority.mockReturnValue({
      signAndSend: jest.fn((account, callback) => {
        callback({ status: { isFinalized: true }, txHash: { toHex: () => "0xmocktxhash" } });
        return Promise.resolve();
      })
    });

    const params = {
      message: { name: "Proof-of-Authority", from: "0x1234567890abcdef", agreementCID: "CID123", signers: [], timestamp: 0, metadata: "" },
      proofCid: "proofCID_1",
      signature: "signature_1"
    };

    const result = await interactor.sendTransaction(wallet, "storeProofOfAuthority", params);
    expect(result).toBe(mockTxHash);
    expect(mockContract.query.storeProofOfAuthority).toHaveBeenCalledWith(
      wallet.address,
      expect.any(Object),
      params
    );
    expect(mockContract.tx.storeProofOfAuthority().signAndSend).toHaveBeenCalledWith(
      wallet,
      expect.any(Function)
    );
  });

  test("should handle transaction failure gracefully", async () => {
    mockContract.query.storeProofOfAuthority.mockResolvedValue({
      gasRequired: new BN(1000000),
      result: { isErr: true }
    });

    const params = {
      message: { name: "Proof-of-Authority", from: "0x1234567890abcdef", agreementCID: "CID123", signers: [], timestamp: 0, metadata: "" },
      proofCid: "proofCID_1",
      signature: "signature_1"
    };

    await expect(interactor.sendTransaction(wallet, "storeProofOfAuthority", params))
      .rejects.toThrow("Transaction failed");

    expect(mockContract.query.storeProofOfAuthority).toHaveBeenCalledWith(
      wallet.address,
      expect.any(Object),
      params
    );
  });

  test("should handle insufficient funds and network errors gracefully", async () => {
    mockContract.tx.storeProofOfAuthority.mockImplementationOnce(() => {
      throw new Error("Insufficient funds");
    });

    const params = {
      message: { name: "Proof-of-Authority", from: "0x1234567890abcdef", agreementCID: "CID123", signers: [], timestamp: 0, metadata: "" },
      proofCid: "proofCID_1",
      signature: "signature_1"
    };

    await expect(interactor.sendTransaction(wallet, "storeProofOfAuthority", params))
      .rejects.toThrow("Transaction failed");

    mockContract.tx.storeProofOfAuthority.mockImplementationOnce(() => {
      throw new Error("Network error");
    });

    await expect(interactor.sendTransaction(wallet, "storeProofOfAuthority", params))
      .rejects.toThrow("Transaction failed");
  });
});

describe("Proof storage functions", () => {
  let interactor: DaosignPolkadotContractInteractor;
  let wallet: KeyringPair;

  const mockContract = {
    query: {
      storeProofOfAuthority: jest.fn(),
      storeProofOfSignature: jest.fn(),
      storeProofOfAgreement: jest.fn()
    },
    tx: {
      storeProofOfAuthority: jest.fn(),
      storeProofOfSignature: jest.fn(),
      storeProofOfAgreement: jest.fn()
    }
  };

  beforeEach(async () => {
    interactor = new DaosignPolkadotContractInteractor("contract_address");
    wallet = { address: "5F3sa2TJAWMqDhXG6jhV4N8ko9reG3gV1sfrZYJxynzVtqr4" } as KeyringPair;
    (ContractPromise as jest.Mock).mockImplementation(() => mockContract);
  });

  test("should store proof of authority successfully with valid parameters", async () => {
    const params: ProofOfAuthorityVariables = {
      proofCID: "proofCID123",
      signature: "signature123",
      message: {
        name: "Valid Proof",
        from: "0x1234",
        agreementCID: "agreementCID123",
        signers: [{ addr: "0x5678", metadata: "metadata" }],
        timestamp: 1234567890,
        metadata: "metadata"
      }
    };

    const mockTxHash = "0xmocktxhash";
    const mockTx = {
      signAndSend: jest.fn((account, callback) => {
        callback({ status: { isFinalized: true }, txHash: { toHex: () => mockTxHash } });
        return Promise.resolve("");
      })
    };

    mockContract.query.storeProofOfAuthority.mockResolvedValue({
      gasRequired: new BN(1000000),
      result: { isErr: false },
      output: {}
    });
    mockContract.tx.storeProofOfAuthority.mockReturnValue(mockTx);

    const result = await interactor.storeProofOfAuthority(wallet, params);
    expect(result).toBe(mockTxHash);
  });

  test("should fail storing proof of authority with invalid parameters", async () => {
    const params = {
      proofCID: "invalid_proofCID",
      signature: "invalid_signature",
      message: {
        name: "Invalid Proof",
        from: "0x1234",
        agreementCID: "",
        signers: [],
        timestamp: 1,
        metadata: ""
      }
    } as ProofOfAuthorityVariables;

    mockContract.query.storeProofOfAuthority.mockResolvedValue({
      gasRequired: new BN(1000000),
      result: { isErr: true }
    });

    await expect(interactor.storeProofOfAuthority(wallet, params)).rejects.toThrow("Transaction failed");
  });

  test("should handle network issues or contract errors in proof storage", async () => {
    const params: ProofOfAgreementVariables = {
      proofCID: "proofCID123",
      message: {
        name: "Agreement Proof",
        authorityCID: "authorityCID123",
        signatureCIDs: ["sigCID1", "sigCID2"],
        timestamp: 1234567890,
        metadata: "metadata"
      }
    };

    mockContract.query.storeProofOfAgreement.mockResolvedValue({
      gasRequired: new BN(1000000),
      result: { isErr: false },
      output: {}
    });
    mockContract.tx.storeProofOfAgreement.mockImplementationOnce(() => {
      throw new Error("Network error");
    });

    await expect(interactor.storeProofOfAgreement(wallet, params)).rejects.toThrow("Network error");
  });
});



