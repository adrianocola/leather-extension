import { useNavigate } from 'react-router-dom';

import { RouteUrls } from '@shared/route-urls';

import { useKeyActions } from '@app/common/hooks/use-key-actions';

import { SignOutDialog } from './sign-out';

interface SignOutProps {
  onClose(): void;
}

export function SignOut({ onClose }: SignOutProps) {
  const { signOut } = useKeyActions();
  const navigate = useNavigate();

  return (
    <SignOutDialog
      isShowing
      onUserDeleteWallet={() => {
        void signOut().finally(() => {
          navigate(RouteUrls.Onboarding);
        });
      }}
      onClose={onClose}
    />
  );
}
