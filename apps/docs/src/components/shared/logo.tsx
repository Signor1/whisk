import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The brand mark. Renders as a plain span — the consumer decides
 * whether to wrap it in a Link.
 *
 * Why: fumadocs's `<InlineNavTitle>` already wraps the title slot in
 * its own `<Link>`, so a self-linking Logo produces `<a><a/></a>`
 * and React fires a hydration error.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="Whisk"
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
        <span className="font-semibold font-jetbrains tracking-tight text-[1.0625rem] text-foreground">
          whisk
        </span>
      ) : null}
    </span>
  );
}
