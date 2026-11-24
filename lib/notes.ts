import data from "./data/past-items.json";

export type Item = { id: string; y: number; tr: string; et: string; u: string; f: string; p: number | null; t: number | null; lv: string; tg: string[]; sim: string[] };
export type NoteStatus = "solved" | "wrong" | "retry";
export type Note = { item_id: string; school: string; status: NoteStatus; memo: string | null; causes: string[] | null; time_sec: number | null; review_at: string | null; review_step: number; updated_at?: string };
export const noteLabel: Record<NoteStatus, string> = { solved: "풀었음", wrong: "틀림", retry: "다시 풀기" };
/** 틀린 이유: 문제집 지침의 오답 분류를 학생 말로 */
export const causes = ["개념 부족", "아이디어 못 떠올림", "조건 놓침", "계산 실수", "서술 부족", "시간 부족"] as const;
export const causeTip: Record<string, string> = {
  "개념 부족": "그 단원 교과서 정의와 정리를 다시 읽고, 같은 개념의 비슷한 기출을 하나 더 풀어요.",
  "아이디어 못 떠올림": "해설의 첫 줄(어디서 출발했는지)만 노트에 옮겨 두고, 비슷한 기출로 그 출발을 연습해요.",
  "조건 놓침": "문제를 읽을 때 조건마다 번호를 매기고, 답안 끝에서 번호를 하나씩 지워 보세요.",
  "계산 실수": "어느 줄에서 틀렸는지 표시해 두고, 다음엔 그 종류 계산 뒤에 한 번 거꾸로 넣어 확인해요.",
  "서술 부족": "답은 맞았는데 점수가 깎이는 경우예요. '조건 → 핵심 식 → 이유 → 결론' 네 줄로 다시 써 보세요.",
  "시간 부족": "타이머로 권장 시간 안에 푸는 연습을 하고, 막힌 소문항은 아는 데까지 적고 넘어가요.",
};
export const pastNames = data.names as Record<string, string>;
export const pastItems = data.items as unknown as Record<string, Item[]>;
export const pastSchools = Object.keys(pastItems).sort((a, b) => pastNames[a].localeCompare(pastNames[b], "ko"));
export const itemIndex: Record<string, Item & { s: string }> = Object.fromEntries(
  Object.entries(pastItems).flatMap(([s, list]) => list.map((it) => [it.id, { ...it, s }])),
);
export const shortName = (code: string) =>
  (pastNames[code] ?? code).replace("고려대학교 세종캠퍼스", "고려대(세종)").replace("연세대학교 미래캠퍼스", "연세대(미래)")
    .replace("한국외국어대학교", "한국외대").replace("서울과학기술대학교", "서울과기대").replace("여자대학교", "여대").replace("대학교", "대");
/** 기출 DB의 풀이 형태 코드를 학생이 읽는 말로 */
export const formName: Record<string, string> = {
  추론: "추론", 분류: "경우 나누기", 최적2단: "최대·최소", 구성: "구성하기", 전수: "모두 세기", 일반화: "일반화",
  점화: "점화식", 귀납구조: "귀납", 존재: "존재 보이기", 귀류: "귀류법", 이중세기: "두 번 세기", 불변량: "불변량",
};
/** 난도 L3~L6 → 1~4 */
export const levelDots = (lv: string) => Math.max(1, Math.min(4, Number(lv.replace("L", "")) - 2 || 2));
export const itemTitle = (id: string) => {
  const it = itemIndex[id];
  return it ? `${shortName(it.s)} ${it.y} ${it.et.replace("수시 ", "")} ${it.id.split("-").pop()}번` : id;
};
export const kstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

/** 약점 분석: 표시한 문항 중 틀림·다시 풀기 비율을 단원·풀이 형태별로 */
export function weakness(notes: Note[]) {
  const unit = new Map<string, { n: number; bad: number }>();
  const form = new Map<string, { n: number; bad: number }>();
  const tag = new Map<string, number>();
  const cause = new Map<string, number>();
  for (const n of notes) {
    const it = itemIndex[n.item_id];
    if (!it) continue;
    const bad = n.status !== "solved" || (n.review_step ?? 0) > 0 ? 1 : 0;
    const u = it.u.split(" > ")[1] ?? it.u ?? "기타";
    const f = formName[it.f] ?? it.f;
    unit.set(u, { n: (unit.get(u)?.n ?? 0) + 1, bad: (unit.get(u)?.bad ?? 0) + bad });
    form.set(f, { n: (form.get(f)?.n ?? 0) + 1, bad: (form.get(f)?.bad ?? 0) + bad });
    if (n.status !== "solved") it.tg.forEach((t) => tag.set(t, (tag.get(t) ?? 0) + 1));
    (n.causes ?? []).forEach((c) => cause.set(c, (cause.get(c) ?? 0) + 1));
  }
  const rate = (m: Map<string, { n: number; bad: number }>) =>
    [...m.entries()].map(([k, v]) => ({ k, n: v.n, bad: v.bad, pct: Math.round((v.bad / v.n) * 100) }))
      .sort((a, b) => b.bad - a.bad || b.pct - a.pct).slice(0, 8);
  return {
    unit: rate(unit), form: rate(form),
    tag: [...tag.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    cause: [...cause.entries()].sort((a, b) => b[1] - a[1]),
  };
}

/** 추천: 틀린 문항과 비슷한 기출 중 아직 안 푼 것 */
export function recommend(notes: Note[], k = 6) {
  const done = new Set(notes.map((n) => n.item_id));
  const out: { id: string; from: string }[] = [];
  for (const n of [...notes].filter((x) => x.status !== "solved").sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))) {
    for (const s of itemIndex[n.item_id]?.sim ?? []) {
      if (!done.has(s) && !out.some((o) => o.id === s)) out.push({ id: s, from: n.item_id });
      if (out.length >= k) return out;
    }
  }
  return out;
}

/** 학교 출제 경향(단원별 문항 수) 대비 내 진도 */
export function schoolCoverage(school: string, notes: Note[]) {
  const mine = new Set(notes.filter((n) => n.school === school).map((n) => n.item_id));
  const m = new Map<string, { n: number; done: number }>();
  for (const it of pastItems[school] ?? []) {
    const u = it.u.split(" > ")[1] ?? (it.u || "기타");
    const v = m.get(u) ?? { n: 0, done: 0 };
    v.n += 1; if (mine.has(it.id)) v.done += 1;
    m.set(u, v);
  }
  return [...m.entries()].map(([k, v]) => ({ k, ...v })).sort((a, b) => b.n - a.n).slice(0, 8);
}
