import { NextResponse, type NextRequest } from "next/server";
import { questions, score } from "@/lib/test";
import { logEvent } from "@/lib/track";
import { userClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const raw = body?.answers ?? {};
  const answers: Record<number, number> = {};
  for (const q of questions) {
    const v = Number(raw[q.id]);
    if (!(v >= 1 && v <= 5)) return NextResponse.json({ ok: false }, { status: 400 });
    answers[q.id] = v;
  }
  const { code, pct } = score(answers);
  await logEvent("test_result", { target: code, path: "/test", meta: { pct, answers } });
  const sb = await userClient();
  if (sb) await sb.rpc("set_my_type", { p_code: code }); // 비회원이면 DB 함수가 무시함
  return NextResponse.json({ code, pct });
}
