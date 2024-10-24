import { DaosignPolkadotContractInteractor } from '../src';
import { Keyring } from '@polkadot/keyring';
import { mock } from 'jest-mock-extended';
import { ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import {cryptoWaitReady} from "@polkadot/util-crypto";

jest.mock('@polkadot/api');

describe('DaosignPolkadotContractInteractor', () => {
  let interactor: DaosignPolkadotContractInteractor;
  let mockWallet: any;
  let mockApi: any;

  beforeEach(async () => {
    await cryptoWaitReady();

    mockApi = mock<ApiPromise>();
    (ApiPromise.create as jest.Mock).mockResolvedValue(mockApi);
    interactor = new DaosignPolkadotContractInteractor('mockAddress');
    const keyring = new Keyring({ type: 'sr25519' });
    mockWallet = keyring.addFromUri('//Alice');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get account balance successfully', async () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    mockApi.query.system = {
      account: jest.fn().mockResolvedValue({
        data: {
          free: new BN(1000000),
        },
      }),
    };

    const balance = await interactor.getAccountBalance(address);
    expect(balance).toBe('1000000');
  });

  it('should throw an error if account balance retrieval fails', async () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    mockApi.query.system = {
      account: jest.fn().mockRejectedValue(new Error('Query failed')),
    };

    await expect(interactor.getAccountBalance(address)).rejects.toThrow('Query failed');
  });
});
