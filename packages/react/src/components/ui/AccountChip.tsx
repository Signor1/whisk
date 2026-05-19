"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import { explorerAddressUrl, type Chain } from "@signordev/whisk-core";
import { useWhiskAccount } from "../../hooks/useWhiskAccount.js";
import { ChainIcon } from "./ChainIcon.js";

function shorten(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Connected-wallet chip. Click opens a Radix DropdownMenu with the
 * connector name, "copy address", "view on explorer", and "disconnect."
 *
 * Radix gives us focus management, keyboard nav (arrow keys / type-to-
 * select), and proper ARIA wiring for free.
 */
export function AccountChip({
  /** Chain used for the explorer link in the menu. Defaults to current. */
  explorerChain,
}: {
  explorerChain?: Chain;
}) {
  const account = useWhiskAccount();
  const primary = account.primary;
  const address = primary?.address;
  const connectorName = primary?.connectorName;
  const currentChain = primary?.currentChain;
  const disconnect = primary?.disconnect ?? (async () => {});

  if (!address) return null;

  const linkChain = explorerChain ?? currentChain;
  const explorer = linkChain
    ? explorerAddressUrl(linkChain, address)
    : undefined;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // ignore — host can wire a toast via `onAccountAction` later
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="whisk-account-chip">
          <span className="whisk-account-chip__avatar" aria-hidden="true" />
          <span className="whisk-account-chip__address">
            {shorten(address)}
          </span>
          <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.6 }} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        {/* Re-establish the Whisk theme scope inside the portal so the
            CSS variables and component rules reach our menu. */}
        <div data-whisk="">
          <DropdownMenu.Content
            className="whisk-account-menu"
            align="end"
            sideOffset={4}
            collisionPadding={8}
          >
            {connectorName ? (
              <div className="whisk-account-menu__meta">
                Connected via {connectorName}
              </div>
            ) : null}

            <DropdownMenu.Item
              className="whisk-account-menu__row"
              onSelect={() => void onCopy()}
            >
              <Copy size={12} strokeWidth={2} />
              Copy address
            </DropdownMenu.Item>

            {explorer ? (
              <DropdownMenu.Item
                className="whisk-account-menu__row"
                onSelect={() =>
                  window.open(explorer, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink size={12} strokeWidth={2} />
                View on explorer
              </DropdownMenu.Item>
            ) : null}

            <DropdownMenu.Separator className="whisk-account-menu__separator" />

            <DropdownMenu.Item
              className="whisk-account-menu__row whisk-account-menu__row--danger"
              onSelect={() => void disconnect()}
            >
              <LogOut size={12} strokeWidth={2} />
              Disconnect
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </div>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * Read-only network pill — shows the chain the wallet is currently on.
 * Pairs with `AccountChip` in the card header.
 */
export function NetworkPill() {
  const account = useWhiskAccount();
  const primary = account.primary;
  const chainName = primary?.chainName;
  const currentChain = primary?.currentChain;
  if (!chainName) return null;
  return (
    <span
      className="whisk-network-pill"
      data-whisk-chain={currentChain}
      title={`Wallet network: ${chainName}`}
    >
      {currentChain ? (
        <ChainIcon
          chain={currentChain}
          size={12}
          className="whisk-network-pill__icon"
        />
      ) : (
        <span className="whisk-network-pill__dot" aria-hidden="true" />
      )}
      {chainName}
    </span>
  );
}
