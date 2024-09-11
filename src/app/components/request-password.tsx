import { FormEvent, useCallback, useState } from 'react';

import { SettingsSelectors } from '@tests/selectors/settings.selectors';
import { Box, Stack, styled } from 'leather-styles/jsx';

import { Button, Logo } from '@leather.io/ui';

import { analytics } from '@shared/utils/analytics';

import { useKeyActions } from '@app/common/hooks/use-key-actions';
import { buildEnterKeyEvent } from '@app/common/hooks/use-modifier-key';
import { WaitingMessages, useWaitingMessage } from '@app/common/hooks/use-waiting-message';
import { Card, Page } from '@app/components/layout';
import {
  useCurrentKeyDetails,
  usePasskeyDetails,
} from '@app/store/software-keys/software-key.selectors';

import { ErrorLabel } from './error-label';

const waitingMessages: WaitingMessages = {
  '2': 'Verifying password…',
  '10': 'Still working…',
  '20': 'Almost there',
};

const caption =
  'Your password is used to secure your Secret Key and is only used locally on your device.';

interface RequestPasswordProps {
  onSuccess(): void;
}
export function RequestPassword({ onSuccess }: RequestPasswordProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { unlockWallet, unlockWalletPasskey } = useKeyActions();
  const defaultKeyDetails = useCurrentKeyDetails();
  const passkeyDetails = usePasskeyDetails();

  const [
    passwordIsRunning,
    passwordWaitingMessage,
    passwordStartWaitingMessage,
    passwordStopWaitingMessage,
  ] = useWaitingMessage(waitingMessages);

  const [
    passkeyIsRunning,
    passkeyWaitingMessage,
    passkeyStartWaitingMessage,
    passkeyStopWaitingMessage,
  ] = useWaitingMessage(waitingMessages);

  const submit = useCallback(async () => {
    const startUnlockTimeMs = performance.now();
    void analytics.track('start_unlock');
    passwordStartWaitingMessage();
    setError('');
    try {
      await unlockWallet(password);
      onSuccess?.();
    } catch (error) {
      setError('The password you entered is invalid');
    }
    passwordStopWaitingMessage();
    const unlockSuccessTimeMs = performance.now();
    void analytics.track('complete_unlock', {
      durationMs: unlockSuccessTimeMs - startUnlockTimeMs,
    });
  }, [passwordStartWaitingMessage, passwordStopWaitingMessage, unlockWallet, password, onSuccess]);

  const unlockWithPasskey = useCallback(async () => {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from(defaultKeyDetails.encryptedSecretKey, c => c.charCodeAt(0)),
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (!assertion) return;

    const encodedChallenge = JSON.parse(
      new TextDecoder().decode(assertion.response.clientDataJSON)
    ).challenge;

    const startUnlockTimeMs = performance.now();
    void analytics.track('start_passkey_unlock');
    passkeyStartWaitingMessage();
    setError('');
    try {
      await unlockWalletPasskey(encodedChallenge);
      onSuccess?.();
    } catch (error) {
      setError('The password you entered is invalid');
    }
    passkeyStopWaitingMessage();
    const unlockSuccessTimeMs = performance.now();
    void analytics.track('complete_passkey_unlock', {
      durationMs: unlockSuccessTimeMs - startUnlockTimeMs,
    });
  }, [
    passkeyStartWaitingMessage,
    passkeyStopWaitingMessage,
    unlockWalletPasskey,
    defaultKeyDetails,
    onSuccess,
  ]);

  return (
    <Page>
      <Card
        contentStyle={{
          p: 'space.00',
        }}
        header={
          <styled.h1 p="space.04" hideBelow="sm">
            <Box px="space.02">
              <Logo />
            </Box>
          </styled.h1>
        }
        footer={
          <Stack gap="space.05" width="100%">
            <Button
              data-testid={SettingsSelectors.UnlockWalletBtn}
              disabled={passwordIsRunning || passkeyIsRunning || !!error}
              aria-busy={passwordIsRunning}
              onClick={submit}
              variant="solid"
              fullWidth
            >
              Continue
            </Button>
            {!!passkeyDetails && (
              <Stack gap="space.05" width="100%">
                <styled.span textStyle="caption.01" textAlign="center" color="ink.text-subdued">
                  or
                </styled.span>
                <Button
                  disabled={passwordIsRunning || passkeyIsRunning || !!error}
                  aria-busy={passkeyIsRunning}
                  onClick={unlockWithPasskey}
                  variant="solid"
                  mt={3}
                  fullWidth
                >
                  Unlock with Passkey
                </Button>
              </Stack>
            )}
          </Stack>
        }
      >
        <Stack gap="space.05" px="space.05" minHeight="330px">
          <styled.h3 textStyle="heading.03">Enter your password</styled.h3>
          <styled.p textStyle="label.02">
            {(passwordIsRunning && (passwordWaitingMessage || passkeyWaitingMessage)) || caption}
          </styled.p>
          <styled.input
            _focus={{ border: 'focus' }}
            autoCapitalize="off"
            autoComplete="off"
            autoFocus
            border="active"
            borderRadius="sm"
            data-testid={SettingsSelectors.EnterPasswordInput}
            height="inputHeight"
            onChange={(e: FormEvent<HTMLInputElement>) => {
              setError('');
              setPassword(e.currentTarget.value);
            }}
            onKeyUp={buildEnterKeyEvent(submit)}
            p="space.04"
            placeholder="Enter your password"
            ring="none"
            type="password"
            textStyle="body.02"
            value={password}
            width="100%"
          />
          {error && <ErrorLabel width="100%">{error}</ErrorLabel>}
        </Stack>
      </Card>
    </Page>
  );
}
