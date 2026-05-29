/**
 * Client-side shim for Circle's API CORS quirk.
 *
 * App Kit's API client adds an `x-user-agent` header to every request
 * it makes to `api.circle.com`. The Circle API doesn't include that
 * header in its `Access-Control-Allow-Headers` response, so any
 * browser CORS preflight that lists `x-user-agent` in
 * `Access-Control-Request-Headers` fails — and every request after
 * the preflight fails with it.
 *
 * Until Circle whitelists the header (or App Kit drops it for browser
 * callers), we wrap `window.fetch` and strip `x-user-agent` from
 * outgoing requests that target `api.circle.com`. The preflight no
 * longer asks Circle to allow the header, so it passes.
 *
 * Scope: this only touches requests aimed at Circle's API. Every
 * other fetch — wagmi RPC calls, our own routes, analytics — passes
 * through untouched.
 */

/**
 * True only when the URL's host is Circle's API (`api.circle.com` or any
 * `*.circle.com` host). Parses the URL and checks the host rather than
 * substring-matching, so the name can't be smuggled into a path or query
 * string (e.g. `https://evil.com/?x=api.circle.com`).
 */
function isCircleApiUrl(url: string): boolean {
  let host: string;
  try {
    host = new URL(url, window.location.href).hostname.toLowerCase();
  } catch {
    return false;
  }
  return host === "circle.com" || host.endsWith(".circle.com");
}

let installed = false;

export function installCircleCorsShim() {
  if (typeof window === "undefined") return;
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (!isCircleApiUrl(url)) {
      return originalFetch(input, init);
    }

    let finalInput: RequestInfo | URL = input;
    let finalInit = init;

    // Path 1: headers baked into a `Request` object.
    if (input instanceof Request) {
      const headers = new Headers(input.headers);
      if (headers.has("x-user-agent")) {
        headers.delete("x-user-agent");
        finalInput = new Request(input, { headers });
      }
    }

    // Path 2: headers passed via `init.headers`.
    if (finalInit?.headers) {
      const headers = new Headers(finalInit.headers);
      if (headers.has("x-user-agent")) {
        headers.delete("x-user-agent");
        finalInit = { ...finalInit, headers };
      }
    }

    return originalFetch(finalInput, finalInit);
  };
}
