import { NextResponse, type NextRequest } from "next/server";
import { questions, score } from "@/lib/test";
import { logEvent } from "@/lib/track";
import { currentUser, serviceClient } from "@/lib/supabase/server";

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
  const user = await currentUser().catch(() => null);
  const sb = serviceClient();
  if (user && sb) await sb.from("profiles").update({ nonsul_type: code }).eq("id", user.id);
  return NextResponse.json({ code, pct });
}
