import { NextResponse, type NextRequest } from "next/server";
import { materials } from "@/lib/site";
import { logEvent } from "@/lib/track";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const m = materials.find((x) => x.slug === slug && x.file);
  if (!m?.file) return NextResponse.json({ error: "not found" }, { status: 404 });
  const sp = req.nextUrl.searchParams;
  await logEvent("download", {
    target: slug,
    path: sp.get("from") ?? undefined,
    meta: { utm_source: sp.get("utm_source") ?? undefined },
  });
  return NextResponse.redirect(new URL(m.file, req.url), 302);
}
