import { NextResponse, type NextRequest } from "next/server";
import { logEvent } from "@/lib/track";

const allowed = new Set(["page_view", "click"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !allowed.has(body.type)) return NextResponse.json({ ok: false }, { status: 400 });
  const meta: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
    if (typeof body[k] === "string") meta[k] = body[k].slice(0, 80);
  }
  await logEvent(body.type, {
    path: String(body.path ?? "").slice(0, 200),
    target: body.target ? String(body.target).slice(0, 80) : undefined,
    meta,
  });
  return NextResponse.json({ ok: true });
}
