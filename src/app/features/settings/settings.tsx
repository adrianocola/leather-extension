import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { SettingsSelectors } from '@tests/selectors/settings.selectors';
import { css } from 'leather-styles/css';
import { Flex, Stack, styled } from 'leather-styles/jsx';

import { useBitcoinClient } from '@leather.io/query';
import {
  ArrowsRepeatLeftRightIcon,
  Caption,
  DropdownMenu,
  ExitIcon,
  ExpandIcon,
  ExternalLinkIcon,
  Flag,
  GlobeTiltedIcon,
  KeyIcon,
  LockIcon,
  MegaphoneIcon,
  PassportIcon,
  SunInCloudIcon,
  SupportIcon,
} from '@leather.io/ui';

import { RouteUrls } from '@shared/route-urls';
import { WalletKeyIds } from '@shared/utils';
import { analytics } from '@shared/utils/analytics';

import { useHasKeys } from '@app/common/hooks/auth/use-has-keys';
import { useKeyActions } from '@app/common/hooks/use-key-actions';
import { useModifierKey } from '@app/common/hooks/use-modifier-key';
import { useWalletType } from '@app/common/use-wallet-type';
import { truncateString } from '@app/common/utils';
import { openInNewTab, openIndexPageInNewTab } from '@app/common/utils/open-in-new-tab';
import { AppVersion } from '@app/components/app-version';
import { Divider } from '@app/components/layout/divider';
import { NetworkSheet } from '@app/features/settings/network/network';
import { SignOut } from '@app/features/settings/sign-out/sign-out-confirm';
import { ThemeSheet } from '@app/features/settings/theme/theme-dialog';
import { useAppDispatch } from '@app/store';
import { useStacksClient } from '@app/store/common/api-clients.hooks';
import { useLedgerDeviceTargetId } from '@app/store/ledger/ledger.selectors';
import { useCurrentNetworkId } from '@app/store/networks/networks.selectors';
import { keyActions } from '@app/store/software-keys/software-key.actions';
import { useCurrentKeyDetails } from '@app/store/software-keys/software-key.selectors';

import { openFeedbackSheet } from '../feedback-button/feedback-button';
import { extractDeviceNameFromKnownTargetIds } from '../ledger/utils/generic-ledger-utils';
import { AdvancedMenuItems } from './components/advanced-menu-items';
import { LedgerDeviceItemRow } from './components/ledger-item-row';

interface SettingsProps {
  canLockWallet?: boolean;
  triggerButton: React.ReactNode;
  toggleSwitchAccount?(): void;
}
export function Settings({
  canLockWallet = true,
  triggerButton,
  toggleSwitchAccount,
}: SettingsProps) {
  const [showSignOut, setShowSignOut] = useState(false);
  const [showChangeTheme, setShowChangeTheme] = useState(false);
  const [showChangeNetwork, setShowChangeNetwork] = useState(false);
  const defaultKeyDetails = useCurrentKeyDetails();
  const dispatch = useAppDispatch();
  const btcClient = useBitcoinClient();
  const stxClient = useStacksClient();

  const { hasKeys, hasLedgerKeys } = useHasKeys();

  const { lockWallet } = useKeyActions();

  const currentNetworkId = useCurrentNetworkId();
  const navigate = useNavigate();

  const { walletType } = useWalletType();
  const targetId = useLedgerDeviceTargetId();

  const location = useLocation();

  const { isPressed: showAdvancedMenuOptions } = useModifierKey('alt', 120);

  const bottomGroupItems = useMemo(
    () =>
      [
        showAdvancedMenuOptions && <AdvancedMenuItems />,
        canLockWallet && hasKeys && walletType === 'software' && (
          <DropdownMenu.Item
            onSelect={() => {
              void analytics.track('lock_session');
              void lockWallet();
              navigate(RouteUrls.Unlock);
            }}
            data-testid={SettingsSelectors.LockListItem}
          >
            <Flag img={<LockIcon />} textStyle="label.02">
              Lock
            </Flag>
          </DropdownMenu.Item>
        ),

        hasKeys && (
          <DropdownMenu.Item
            onSelect={() => setShowSignOut(!showSignOut)}
            data-testid={SettingsSelectors.SignOutListItem}
          >
            <Flag color="red.action-primary-default" img={<ExitIcon />} textStyle="label.02">
              Sign out
            </Flag>
          </DropdownMenu.Item>
        ),
      ].filter(Boolean),
    [canLockWallet, hasKeys, lockWallet, navigate, showAdvancedMenuOptions, showSignOut, walletType]
  );

  const configurePasskeys = useCallback(async () => {
    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(defaultKeyDetails.encryptedSecretKey, c => c.charCodeAt(0)),
          rp: {
            name: 'Leather',
          },
          user: {
            id: Uint8Array.from('leather', c => c.charCodeAt(0)),
            name: 'Leather Extension',
            displayName: 'Leather Extension',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -8, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (!credential) return;

      const encodedChallenge = JSON.parse(
        new TextDecoder().decode(credential.response.clientDataJSON)
      ).challenge;

      dispatch(
        keyActions.setWalletEncryptionPassword(WalletKeyIds.PASSKEY, {
          password: encodedChallenge,
          stxClient,
          btcClient,
        })
      );
      alert('Passkey configured successfully');
    } catch (e) {
      alert(`Error configuring passkeys: ${(e as Error).message}`);
    }
  }, [defaultKeyDetails, dispatch, stxClient, btcClient]);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.IconButton>{triggerButton}</DropdownMenu.IconButton>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            side="bottom"
            sideOffset={8}
            className={css({
              width: 'settingsMenuWidth',
              maxHeight: 'var(--radix-dropdown-menu-content-available-height)',
              overflowY: 'scroll',
            })}
          >
            <DropdownMenu.Group>
              {hasLedgerKeys && targetId && (
                <DropdownMenu.Item>
                  <LedgerDeviceItemRow deviceType={extractDeviceNameFromKnownTargetIds(targetId)} />
                </DropdownMenu.Item>
              )}
              {hasKeys && toggleSwitchAccount && (
                <DropdownMenu.Item
                  data-testid={SettingsSelectors.SwitchAccountTrigger}
                  onSelect={toggleSwitchAccount}
                >
                  <Flag img={<ArrowsRepeatLeftRightIcon />} textStyle="label.02">
                    Switch account
                  </Flag>
                </DropdownMenu.Item>
              )}
              {hasKeys && walletType === 'software' && (
                <DropdownMenu.Item
                  data-testid={SettingsSelectors.ViewSecretKeyListItem}
                  onSelect={() => navigate(RouteUrls.ViewSecretKey)}
                >
                  <Flag img={<KeyIcon />} textStyle="label.02">
                    View Secret Key
                  </Flag>
                </DropdownMenu.Item>
              )}
              <styled.div hideFrom="md">
                <DropdownMenu.Item
                  data-testid={SettingsSelectors.OpenWalletInNewTab}
                  onSelect={() => {
                    void analytics.track('click_open_in_new_tab_menu_item');
                    openIndexPageInNewTab(location.pathname);
                  }}
                >
                  <Flag img={<ExpandIcon />} textStyle="label.02">
                    Maximize
                  </Flag>
                </DropdownMenu.Item>
              </styled.div>

              <DropdownMenu.Item
                data-testid={SettingsSelectors.ChangeNetworkAction}
                onSelect={() => {
                  void analytics.track('click_change_network_menu_item');
                  setShowChangeNetwork(!showChangeNetwork);
                }}
              >
                <Flag img={<GlobeTiltedIcon />}>
                  <Stack gap="space.00">
                    <styled.span textStyle="label.02">Change network</styled.span>
                    <Caption data-testid={SettingsSelectors.CurrentNetwork}>
                      {truncateString(currentNetworkId.toString(), 15)}
                    </Caption>
                  </Stack>
                </Flag>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                data-testid={SettingsSelectors.ToggleTheme}
                onSelect={() => {
                  void analytics.track('click_change_theme_menu_item');
                  setShowChangeTheme(!showChangeTheme);
                }}
              >
                <Flag img={<SunInCloudIcon />}>
                  <Flex justifyContent="space-between" textStyle="label.02">
                    Change theme
                  </Flex>
                </Flag>
              </DropdownMenu.Item>

              <DropdownMenu.Item onSelect={configurePasskeys}>
                <Flag img={<PassportIcon />}>
                  <Flex justifyContent="space-between" textStyle="label.02">
                    Configure Passkeys
                  </Flex>
                </Flag>
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <Divider />
            <DropdownMenu.Group>
              <DropdownMenu.Item
                data-testid={SettingsSelectors.GetSupportMenuItem}
                onSelect={() => {
                  openInNewTab('https://leather.gitbook.io/guides/installing/contact-support');
                }}
              >
                <Flag img={<SupportIcon />} textStyle="label.02">
                  <Flex justifyContent="space-between">
                    Get support
                    <ExternalLinkIcon variant="small" />
                  </Flex>
                </Flag>
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => openFeedbackSheet()}>
                <Flag img={<MegaphoneIcon />} textStyle="label.02">
                  Give feedback
                </Flag>
              </DropdownMenu.Item>
            </DropdownMenu.Group>

            {bottomGroupItems.length > 0 && (
              <>
                <Divider />
                <DropdownMenu.Group>{...bottomGroupItems}</DropdownMenu.Group>
              </>
            )}

            <AppVersion />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {showSignOut && <SignOut onClose={() => setShowSignOut(!showSignOut)} />}
      {showChangeTheme && <ThemeSheet onClose={() => setShowChangeTheme(!showChangeTheme)} />}
      {showChangeNetwork && (
        <NetworkSheet onClose={() => setShowChangeNetwork(!showChangeNetwork)} />
      )}
    </>
  );
}
