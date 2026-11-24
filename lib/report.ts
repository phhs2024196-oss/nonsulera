import "server-only";
import { causeTip, itemIndex, itemTitle, recommend, weakness, type Note } from "./notes";
import { rawComment } from "./comments";

export const REPORT_STEP = 10;
export const badCount = (notes: Note[]) => notes.filter((n) => n.status === "wrong" || n.status === "retry").length;

/** 약점 리포트 스냅샷. 다시 볼 문항이 10의 배수에 이를 때 한 번 만든다 */
export function buildReport(notes: Note[]) {
  const bad = notes.filter((n) => n.status !== "solved" && itemIndex[n.item_id]);
  const w = weakness(notes);
  // 틀린 문항들의 '다시 볼 개념'을 모아 자주 나온 순서로
  const cc = new Map<string, number>();
  for (const n of bad) for (const c of rawComment(n.item_id)?.c ?? []) {
    const k = c.replace(/\$[^$]*\$/g, "").replace(/\s+/g, " ").trim();
    if (k.length >= 2) cc.set(k, (cc.get(k) ?? 0) + 1);
  }
  const concepts = [...cc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const recs = recommend(notes, 6).map((r) => ({ id: r.id, title: itemTitle(r.id), from: itemTitle(r.from), school: itemIndex[r.id]?.s }));
  const overall = notes.length ? Math.round((bad.length / notes.length) * 100) : 0;
  const topUnit = w.unit[0];
  const topCause = w.cause[0];
  const focus = [
    topUnit && topUnit.bad > 0 ? `${topUnit.k}에서 ${topUnit.n}문항 중 ${topUnit.bad}문항을 다시 봐야 해요(${topUnit.pct}%, 전체 평균 ${overall}%).` : "",
    topCause ? `틀린 이유는 '${topCause[0]}'가 ${topCause[1]}번으로 가장 많아요.` : "틀린 이유를 고르면 다음 리포트부터 이유별 처방이 붙어요.",
    concepts[0] ? `틀린 문항에 가장 자주 걸린 개념은 '${concepts[0][0]}'(${concepts[0][1]}문항)이에요.` : "",
  ].filter(Boolean);
  return {
    made: new Date().toISOString(), total: notes.length, bad: bad.length, overall,
    focus, unit: w.unit, form: w.form, tag: w.tag,
    cause: w.cause.map(([k, v]) => ({ k, v, tip: causeTip[k] ?? "" })),
    concepts, recs,
    plan: [
      topUnit && topUnit.bad > 0 ? `이번 주는 ${topUnit.k} 문항만 다시 풀어요. 노트의 과목 필터로 골라 볼 수 있어요.` : "",
      topCause ? causeTip[topCause[0]] : "",
      recs[0] ? `비슷한 기출 ${recs.length}문항을 추천해 뒀어요. 틀린 문항과 같은 생각을 다른 문제로 연습하는 용도예요.` : "",
    ].filter(Boolean),
  };
}
export type Report = ReturnType<typeof buildReport>;
