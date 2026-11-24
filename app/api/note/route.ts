import { NextResponse, type NextRequest } from "next/server";
import { userClient, currentUser } from "@/lib/supabase/server";
import { causes, itemIndex, type Note } from "@/lib/notes";
import { REPORT_STEP, badCount, buildReport } from "@/lib/report";

const events = ["mark", "review_ok", "review_fail", "memo", "time"];

/** 오답 노트 저장. event: mark(상태)·review_ok/review_fail(복습 결과)·memo(메모·틀린 이유)·time(타이머) */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const item = String(b.item ?? "");
  const it = itemIndex[item];
  if (!it) return NextResponse.json({ error: "bad item" }, { status: 400 });
  const event = events.includes(b.event) ? b.event : "mark";
  const status = ["solved", "wrong", "retry"].includes(b.status) ? b.status : "";
  const cs = Array.isArray(b.causes) ? b.causes.filter((c: unknown) => (causes as readonly string[]).includes(String(c))).slice(0, 6) : null;
  const time = Number.isFinite(b.time) ? Math.round(b.time) : null;
  const sb = await userClient();
  const { data, error } = (await sb?.rpc("save_note2", {
    p_item: item, p_school: it.s, p_status: status, p_memo: b.memo == null ? null : String(b.memo).slice(0, 1000),
    p_causes: cs, p_time: time, p_event: event,
  })) ?? {};
  if (error) return NextResponse.json({ error: "save" }, { status: 500 });

  // 다시 볼 문항이 10개, 20개…가 되면 약점 리포트를 한 번 만든다
  let report: number | null = null;
  if (["mark", "review_fail"].includes(event) && sb) {
    const all = ((await sb.from("item_notes").select("item_id, school, status, memo, causes, time_sec, review_at, review_step, updated_at"))?.data ?? []) as Note[];
    const level = Math.floor(badCount(all) / REPORT_STEP) * REPORT_STEP;
    if (level >= REPORT_STEP) {
      const { data: had } = await sb.from("weak_reports").select("id").eq("level", level).maybeSingle();
      if (!had) {
        const { data: id } = await sb.rpc("save_weak_report", { p_level: level, p_report: buildReport(all) });
        report = (id as number | null) ?? null;
      }
    }
  }
  return NextResponse.json({ ok: true, note: data, report });
}
