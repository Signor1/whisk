import { NextResponse } from "next/server";

const ALLOWED_HOSTS = (process.env.KIT_KEY_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowedOrigin(req: Request): boolean {
  // In dev we don't bother — localhost + your dev hostname both pass.
  if (process.env.NODE_ENV !== "production") return true;
  if (ALLOWED_HOSTS.length === 0) return true; // not configured → fail open

  const origin = req.headers.get("origin") ?? "";
  const referer = req.headers.get("referer") ?? "";
  return ALLOWED_HOSTS.some(
    (host) => origin.includes(host) || referer.includes(host),
  );
}

export async function GET(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const available = Boolean(process.env.CIRCLE_KIT_KEY);
  return NextResponse.json({ available });
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const key = process.env.CIRCLE_KIT_KEY;
  if (!key) {
    return NextResponse.json({ error: "kit-key-unset" }, { status: 503 });
  }
  return NextResponse.json({ kitKey: key });
}
