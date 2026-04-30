import clsx, { type ClassValue } from "clsx";

/**
 * Tiny class-name composer. Re-exports `clsx` under a Whisk-flavoured name
 * so component code reads consistently and we keep the option to swap the
 * underlying library later without touching call sites.
 */
export function cn(...values: ClassValue[]): string {
  return clsx(values);
}
