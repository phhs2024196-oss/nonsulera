import data from "./data/diag.json";

export type School = {
  code: string; name: string; short: string; quota: string; ratio: string; recordPct: number;
  csat: { who: string; rule: string }[];
  exam: { minutes: string; items: string; type: string };
  dates2027: string[]; rate2026: string; src: string;
};
export const diagYear = data.year;
export const schools = data.schools as unknown as School[];
export const schoolName = (code: string) => schools.find((s) => s.code === code)?.short ?? code;

/** 수능 예상 등급: 국어·수학·영어·탐구(상위 1과목)·한국사 */
export type Scores = { kor?: number; math?: number; eng?: number; tam?: number; hist?: number };
export type CsatStatus = "none" | "ok" | "short" | "check" | "unknown";

const NONE = /^(없음|미적용|수능최저학력기준 적용하지 않음|적용하지 않음|해당 없음)$/;

/** 한 모집단위 묶음의 최저 기준을 내 예상 등급과 비교한다. 해석이 애매하면 check(직접 확인)로 둔다. */
export function judge(rule: string, s: Scores): { status: CsatStatus; need?: string; mine?: number } {
  const r = rule.trim();
  if (NONE.test(r) || /^없음|미적용|적용하지 않음|최저.*없음/.test(r)) return { status: "none" };
  if (/각\s*\d\s*등급|필수|포함|미적분|기하|평균/.test(r)) return { status: "check" };
  const vals = [s.kor, s.math, s.eng, s.tam].filter((x): x is number => typeof x === "number");
  const one = r.match(/(\d)\s*개\s*영역\s*(?:이상\s*)?(\d)\s*등급\s*이내/);
  if (one && one[1] === "1") {
    if (!vals.length) return { status: "unknown", need: `1개 ${one[2]}등급` };
    const best = Math.min(...vals);
    return { status: best <= Number(one[2]) ? "ok" : "short", need: `1개 ${one[2]}등급`, mine: best };
  }
  const m = r.match(/(\d)\s*개\s*(?:영역|과목)?[^0-9]{0,12}?합[^0-9]{0,4}(\d{1,2})\s*(?:등급\s*)?이내/);
  if (!m) return { status: "check" };
  const k = Number(m[1]), lim = Number(m[2]);
  if (vals.length < k) return { status: "unknown", need: `${k}개 합 ${lim}` };
  const mine = vals.sort((a, b) => a - b).slice(0, k).reduce((a, b) => a + b, 0);
  const histOk = !/한국사\s*(\d)/.test(r) || s.hist === undefined || s.hist <= Number(r.match(/한국사\s*(\d)/)![1]);
  return { status: mine <= lim && histOk ? "ok" : "short", need: `${k}개 합 ${lim}`, mine };
}

const MED = /의예|의학|약학|치의|한의|수의|간호/;
/** 일반 모집단위(의약 계열 제외) 기준 */
export function generalRule(s: School) {
  return s.csat.find((c) => !MED.test(c.who) || /제외/.test(c.who)) ?? s.csat[0];
}
