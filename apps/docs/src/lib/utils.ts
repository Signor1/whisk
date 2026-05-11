import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard shadcn-style `cn()` helper. Combines `clsx` (conditional
 * class composition) with `tailwind-merge` (deduping conflicting
 * Tailwind utilities like `p-2 p-4` → `p-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
