"use client";

/**
 * The opt-in "powered by Whisk" footer rendered at the bottom of the
 * widget card.
 *
 * Intentionally just a wordmark — no full logo. Devs who want zero
 * branding turn it off via `<WhiskSend showFooter={false} />`. Devs who
 * embed Whisk in their own marketing surfaces (docs, hero pages) use the
 * full PNG/SVG logos directly.
 */
export function Footer() {
  return (
    <div className="whisk-footer">
      <span>powered by</span>
      <a
        href="https://github.com/Signor1/whisk"
        target="_blank"
        rel="noreferrer"
        className="whisk-footer__mark"
        style={{ textDecoration: "none" }}
      >
        whisk
      </a>
    </div>
  );
}
