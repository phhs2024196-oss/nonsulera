import { NextResponse, type NextRequest } from "next/server";
import { userClient, currentUser } from "@/lib/supabase/server";
import { schools } from "@/lib/diag";
import { logEvent } from "@/lib/track";

const g = (v: unknown) => (typeof v === "number" && v >= 1 && v <= 9 ? Math.round(v) : undefined);

/** 진단 실행 기록 + (회원이면) 입력값과 찜한 대학 저장 */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const sc = b.scores ?? {};
  const scores = { kor: g(sc.kor), math: g(sc.math), eng: g(sc.eng), tam: g(sc.tam), hist: g(sc.hist) };
  const pref = ["record_weak", "record_ok"].includes(b.pref) ? b.pref : undefined;
  const codes = new Set(schools.map((s) => s.code));
  const saved: string[] | undefined = Array.isArray(b.saved) ? b.saved.filter((c: unknown) => codes.has(String(c))).slice(0, 20) : undefined;

  if (b.action === "run") await logEvent("diagnosis", { meta: { ...scores, pref } });
  if (b.action === "save_school" && typeof b.code === "string" && codes.has(b.code)) await logEvent("save_school", { target: b.code });

  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: true, saved: false });
  const sb = await userClient();
  await sb?.rpc("save_my_diag", { p_diag: { ...scores, pref }, p_saved: saved ?? null });
  return NextResponse.json({ ok: true, saved: true });
}
