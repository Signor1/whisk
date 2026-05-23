"use client";

import type { ComponentType, SVGAttributes } from "react";
import type { Token } from "@usewhisk/core";

import {
  TokenDAI,
  TokenEURC,
  TokenPYUSD,
  TokenUSDC,
  TokenUSDE,
  TokenUSDT,
} from "@web3icons/react";

type IconComponent = ComponentType<
  SVGAttributes<SVGSVGElement> & {
    variant?: "branded" | "mono" | "background";
    size?: number | string;
  }
>;

const TOKEN_ICONS: Partial<Record<Token, IconComponent>> = {
  USDC: TokenUSDC,
  EURC: TokenEURC,
  USDT: TokenUSDT,
  USDe: TokenUSDE,
  DAI: TokenDAI,
  PYUSD: TokenPYUSD,
  // cirBTC and NATIVE intentionally absent — no branded icon ships for either.
};

export type TokenIconProps = {
  token: Token;
  size?: number;
  variant?: "branded" | "mono" | "background";
  className?: string;
};

/** Branded token logo. Returns `null` for tokens without a registered icon. */
export function TokenIcon({
  token,
  size = 16,
  variant = "branded",
  className,
}: TokenIconProps) {
  const Icon = TOKEN_ICONS[token];
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      variant={variant}
      aria-hidden="true"
      className={className}
    />
  );
}
