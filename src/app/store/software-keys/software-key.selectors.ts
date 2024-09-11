import { useSelector } from 'react-redux';

import { createSelector } from '@reduxjs/toolkit';

import { initBigNumber } from '@leather.io/utils';

import { WalletKeyIds } from '@shared/utils';

import { initialSearchParams } from '@app/common/initial-search-params';
import { RootState } from '@app/store';
import { keyAdapter } from '@app/store/software-keys/software-key.slice';

import { selectStacksChain } from '../chains/stx-chain.selectors';

const keySelectors = keyAdapter.getSelectors();

const selectKeysSlice = (state: RootState) => state['softwareKeys'];

export const selectSoftwareKey = createSelector(
  [selectKeysSlice, (_, keyId: WalletKeyIds) => keyId],
  (state, keyId: WalletKeyIds) => {
    return keySelectors.selectById(state as any, keyId);
  }
);

export const selectDefaultSoftwareKey = createSelector(selectKeysSlice, state =>
  keySelectors.selectById(state as any, WalletKeyIds.DEFAULT)
);

export const selectHasSecretKey = createSelector(
  selectDefaultSoftwareKey,
  softwareKey => !!softwareKey?.encryptedSecretKey
);

export function useCurrentKeyDetails() {
  return useSelector(selectDefaultSoftwareKey);
}

const selectPasskeySoftwareKey = createSelector(selectKeysSlice, state =>
  keySelectors.selectById(state as any, WalletKeyIds.PASSKEY)
);

export function usePasskeyDetails() {
  return useSelector(selectPasskeySoftwareKey);
}

export const selectCurrentAccountIndex = createSelector(selectStacksChain, state => {
  const customAccountIndex = initialSearchParams.get('accountIndex');
  if (customAccountIndex && initBigNumber(customAccountIndex).isInteger()) {
    return initBigNumber(customAccountIndex).toNumber();
  }
  return state[WalletKeyIds.DEFAULT].currentAccountIndex;
});
