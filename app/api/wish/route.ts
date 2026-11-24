import { NextResponse, type NextRequest } from "next/server";
import { books, materials } from "@/lib/site";
import { logEvent } from "@/lib/track";

const keys = new Set([...books.map((b) => b.key), ...materials.map((m) => m.slug), "grading"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !keys.has(body.target)) return NextResponse.json({ ok: false }, { status: 400 });
  await logEvent("wish", { target: body.target, path: String(body.path ?? "") });
  return NextResponse.json({ ok: true });
}
