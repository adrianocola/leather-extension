import { PayloadAction, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import { WalletKeyIds } from '@shared/utils';

import { migrateVaultReducerStoreToNewStateStructure } from '../utils/vault-reducer-migration';

interface KeyConfig {
  type: 'software';
  id: WalletKeyIds;
  encryptedSecretKey: string;
  salt: string;
}
export const keyAdapter = createEntityAdapter<KeyConfig>();

export const initialKeysState = keyAdapter.getInitialState();

export const keySlice = createSlice({
  name: 'softwareKeys',
  initialState: migrateVaultReducerStoreToNewStateStructure(initialKeysState),
  reducers: {
    createSoftwareWalletComplete(state, action: PayloadAction<KeyConfig>) {
      keyAdapter.addOne(state as any, action.payload);
    },

    signOut(state) {
      keyAdapter.removeAll(state as any);
    },

    debugKillStacks() {
      // if (state.entities.default?.type !== 'ledger') return;
      // state.entities.default.publicKeys = [];
    },
  },
});
