import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/supabase/server";
import { commentFor } from "@/lib/comments";

/** 오답 코멘트(회원만): 다시 볼 개념·교과서 쪽, 주의할 조건, 막히는 단계 */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const c = commentFor(req.nextUrl.searchParams.get("id") ?? "");
  return c ? NextResponse.json(c, { headers: { "cache-control": "private, max-age=3600" } }) : NextResponse.json({ error: "none" }, { status: 404 });
}
