import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/track";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/me";
  const sb = await userClient();
  if (code && sb) {
    const { data } = await sb.auth.exchangeCodeForSession(code);
    const u = data.user;
    if (u && Date.now() - new Date(u.created_at).getTime() < 5 * 60 * 1000) {
      await logEvent("signup", { meta: { provider: u.app_metadata?.provider } });
    }
  }
  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/me", req.url));
}
