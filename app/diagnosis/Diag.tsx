"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { judge, generalRule, type School, type Scores, type CsatStatus } from "@/lib/diag";

type Pref = "record_weak" | "record_ok";
const label: Record<CsatStatus, string> = { none: "최저 없음", ok: "충족 예상", short: "부족", check: "직접 확인", unknown: "등급 입력 필요" };
const order: Record<CsatStatus, number> = { none: 0, ok: 0, check: 1, unknown: 1, short: 2 };
const fields: [keyof Scores, string][] = [["kor", "국어"], ["math", "수학"], ["eng", "영어"], ["tam", "탐구(상위 1과목)"], ["hist", "한국사"]];

export default function Diag({ schools, loggedIn, initial }: { schools: School[]; loggedIn: boolean; initial: { diag: Record<string, unknown> | null; saved: string[] } | null }) {
  const d0 = (initial?.diag ?? {}) as Scores & { pref?: Pref };
  const [sc, setSc] = useState<Scores>({ kor: d0.kor, math: d0.math, eng: d0.eng, tam: d0.tam, hist: d0.hist });
  const [pref, setPref] = useState<Pref>(d0.pref ?? "record_weak");
  const [onlyOk, setOnlyOk] = useState(false);
  const [saved, setSaved] = useState<string[]>(initial?.saved ?? []);
  const [ran, setRan] = useState(!!initial?.diag);
  const [msg, setMsg] = useState("");

  const rows = useMemo(() => {
    return schools
      .map((s) => {
        const g = generalRule(s);
        const j = g ? judge(g.rule, sc) : { status: "none" as CsatStatus };
        return { s, g, j };
      })
      .filter((r) => !onlyOk || r.j.status === "none" || r.j.status === "ok")
      .sort((a, b) =>
        order[a.j.status] - order[b.j.status] ||
        (pref === "record_weak" ? a.s.recordPct - b.s.recordPct : 0) ||
        a.s.short.localeCompare(b.s.short, "ko"));
  }, [schools, sc, pref, onlyOk]);

  const post = (body: object) => fetch("/api/diag", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setRan(true);
    await post({ action: "run", scores: sc, pref });
    setMsg(loggedIn ? "내 기록에 저장했어요." : "");
    document.getElementById("result")?.scrollIntoView({ behavior: "smooth" });
  }
  async function toggle(code: string) {
    if (!loggedIn) return setMsg("대학 찜은 로그인하면 쓸 수 있어요.");
    const next = saved.includes(code) ? saved.filter((c) => c !== code) : [...saved, code].slice(0, 20);
    setSaved(next);
    await post({ action: next.includes(code) ? "save_school" : "unsave", code, scores: sc, pref, saved: next });
  }
  const set = (k: keyof Scores, v: string) => setSc((s) => ({ ...s, [k]: v ? Number(v) : undefined }));
  const counts = rows.reduce((m, r) => ({ ...m, [r.j.status]: (m[r.j.status] ?? 0) + 1 }), {} as Record<string, number>);

  return (
    <>
      <form className="diag-form" onSubmit={run}>
        <div className="diag-grades">
          {fields.map(([k, t]) => (
            <label key={k} className="f">{t}
              <select value={sc[k] ?? ""} onChange={(e) => set(k, e.target.value)}>
                <option value="">모름</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}등급</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="chips" style={{ marginTop: 14 }}>
          <label><input type="radio" name="pref" checked={pref === "record_weak"} onChange={() => setPref("record_weak")} />내신이 약한 편이에요</label>
          <label><input type="radio" name="pref" checked={pref === "record_ok"} onChange={() => setPref("record_ok")} />내신은 괜찮아요</label>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 18 }}>
          <button className="btn" type="submit">진단하기</button>
          {!loggedIn && <span className="faint"><Link href="/login?next=/diagnosis">로그인</Link>하면 결과와 찜한 대학이 저장돼요.</span>}
          {msg && <span className="faint" role="status">{msg}</span>}
        </div>
      </form>

      {ran && (
        <section id="result" style={{ marginTop: 40 }}>
          <div className="diag-sum">
            <span><b>{(counts.none ?? 0) + (counts.ok ?? 0)}</b>곳 최저 없음·충족 예상</span>
            <span><b>{(counts.check ?? 0) + (counts.unknown ?? 0)}</b>곳 직접 확인</span>
            <span><b>{counts.short ?? 0}</b>곳 부족</span>
            <label className="check" style={{ marginLeft: "auto" }}><input type="checkbox" checked={onlyOk} onChange={(e) => setOnlyOk(e.target.checked)} />가능한 곳만 보기</label>
          </div>
          <p className="diag-next">
            {(() => {
              const okRows = rows.filter((r) => r.j.status === "none" || r.j.status === "ok");
              const noRec = okRows.filter((r) => r.s.recordPct === 0).length;
              return okRows.length
                ? `지금 등급으로 지원할 수 있는 ${okRows.length}곳 중 ${noRec}곳은 학생부를 보지 않아요. 마음에 드는 학교에 ☆를 누르면 내 기록에서 모집요강 소식을 받아 볼 수 있어요.`
                : "지금 입력한 등급으로는 최저를 맞추는 곳이 적어요. 한 과목만 한 등급 올려 넣어 보면 몇 곳이 열리는지 바로 보여요.";
            })()}
          </p>
          <div className="diag-list">
            {rows.map(({ s, g, j }) => (
              <article key={s.code} className={`diag-card st-${j.status}`}>
                <header>
                  <h3>{s.short}</h3>
                  <span className={`tag st-${j.status}`}>{label[j.status]}</span>
                  <button type="button" className={`star ${saved.includes(s.code) ? "on" : ""}`} onClick={() => toggle(s.code)} aria-pressed={saved.includes(s.code)} aria-label={`${s.short} 찜`}>
                    {saved.includes(s.code) ? "★" : "☆"}
                  </button>
                </header>
                <dl>
                  <dt>수능최저</dt>
                  <dd>{g?.rule || "없음"}{j.mine !== undefined && <span className="faint"> · 내 {j.need?.startsWith("1개") ? "최고 등급" : "합"} {j.mine}</span>}</dd>
                  <dt>학생부</dt><dd>{s.recordPct ? `${s.recordPct}% 반영` : "반영 안 함"} <span className="faint">({s.ratio})</span></dd>
                  {(s.exam.minutes || s.exam.items) && <><dt>시험</dt><dd>{[s.exam.minutes && `${s.exam.minutes}분`, s.exam.items].filter(Boolean).join(" · ")}</dd></>}
                  {s.dates2027.length > 0 && <><dt>2027 시험일</dt><dd>{s.dates2027.join(", ")}</dd></>}
                  {s.rate2026 && <><dt>2026 경쟁률</dt><dd>{Number(s.rate2026).toFixed(1)} : 1 <span className="faint">(자연계)</span></dd></>}
                </dl>
                {s.csat.length > 1 && (
                  <details><summary className="faint">다른 모집단위 기준 {s.csat.length - 1}개</summary>
                    <ul>{s.csat.filter((c) => c !== g && c.rule).map((c, i) => <li key={i}><b>{c.who}</b>: {c.rule}</li>)}</ul>
                  </details>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
