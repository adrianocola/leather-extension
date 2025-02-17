import { Box, Flex, styled } from 'leather-styles/jsx';

import type { Money } from '@leather.io/models';
import {
  BulletSeparator,
  Caption,
  ItemLayout,
  Pressable,
  SkeletonLoader,
  shimmerStyles,
} from '@leather.io/ui';
import { spamFilter } from '@leather.io/utils';

import { BasicTooltip } from '@app/ui/components/tooltip/basic-tooltip';

import { parseCryptoAssetBalance } from './crypto-asset-item.layout.utils';

interface CryptoAssetItemLayoutProps {
  availableBalance: Money;
  balanceSuffix?: string;
  captionLeft: string;
  captionRightBulletInfo?: React.ReactNode;
  contractId?: string;
  fiatBalance?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  isLoadingAdditionalData?: boolean;
  onSelectAsset?(symbol: string, contractId?: string): void;
  titleLeft: string;
  titleRightBulletInfo?: React.ReactNode;
}
export function CryptoAssetItemLayout({
  availableBalance,
  balanceSuffix,
  captionLeft,
  captionRightBulletInfo,
  contractId,
  fiatBalance,
  icon,
  isLoading = false,
  isLoadingAdditionalData = false,
  onSelectAsset,
  titleLeft,
  titleRightBulletInfo,
}: CryptoAssetItemLayoutProps) {
  const { availableBalanceString, dataTestId, formattedBalance } =
    parseCryptoAssetBalance(availableBalance);

  const titleRight = (
    <SkeletonLoader width="126px" isLoading={isLoading}>
      <BasicTooltip
        asChild
        label={formattedBalance.isAbbreviated ? availableBalanceString : undefined}
        side="left"
      >
        <Flex alignItems="center" gap="space.02" textStyle="label.02">
          <BulletSeparator>
            <styled.span
              data-state={isLoadingAdditionalData ? 'loading' : undefined}
              className={shimmerStyles}
            >
              {formattedBalance.value} {balanceSuffix}
            </styled.span>
            {titleRightBulletInfo}
          </BulletSeparator>
        </Flex>
      </BasicTooltip>
    </SkeletonLoader>
  );

  const captionRight = (
    <SkeletonLoader width="78px" isLoading={isLoading}>
      <Flex alignItems="center" color="ink.text-subdued" gap="space.02">
        <BulletSeparator>
          <Caption
            data-state={isLoadingAdditionalData ? 'loading' : undefined}
            className={shimmerStyles}
          >
            {availableBalance.amount.toNumber() > 0 ? fiatBalance : null}
          </Caption>
          {captionRightBulletInfo}
        </BulletSeparator>
      </Flex>
    </SkeletonLoader>
  );

  const isInteractive = !!onSelectAsset;

  const content = (
    <ItemLayout
      flagImg={icon}
      titleLeft={spamFilter(titleLeft)}
      captionLeft={spamFilter(captionLeft)}
      titleRight={titleRight}
      captionRight={captionRight}
    />
  );

  if (isInteractive)
    return (
      <Pressable
        data-testid={dataTestId}
        onClick={() => onSelectAsset(availableBalance.symbol, contractId)}
        my="space.02"
      >
        {content}
      </Pressable>
    );

  return <Box my="space.02">{content}</Box>;
}
