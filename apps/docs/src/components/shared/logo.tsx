import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Whisk wordmark + logo combo. The supplied asset is the terracotta
 * "W" glyph at 277×125; we use it at a tighter aspect on the nav and
 * pair it with the lowercase wordmark to read as a unified mark.
 *
 * `Image` priority is on so the LCP element doesn't lazy-load.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md",
        className,
      )}
      aria-label="Whisk home"
    >
      <Image
        src="/logo.png"
        alt=""
        width={277}
        height={125}
        priority
        className="h-7 w-auto"
      />
      {showWordmark ? (
        <span className="font-semibold tracking-tight text-[1.0625rem] text-foreground">
          whisk
        </span>
      ) : null}
    </Link>
  );
}
