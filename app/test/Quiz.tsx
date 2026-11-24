"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { questions, scale } from "@/lib/test";

const PER = 6;

export default function Quiz() {
  const router = useRouter();
  const [ans, setAns] = useState<Record<number, number>>({});
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const pages = Math.ceil(questions.length / PER);
  const list = questions.slice(page * PER, page * PER + PER);
  const done = list.every((q) => ans[q.id]);
  const answered = Object.keys(ans).length;

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    top.current?.scrollIntoView({ block: "start" });
  }, [page]);

  async function finish() {
    setBusy(true);
    const res = await fetch("/api/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers: ans }) });
    const r = await res.json().catch(() => null);
    if (r?.code) {
      const p = r.pct;
      router.push(`/test/result/${r.code}?v=${p.think}-${p.write}-${p.tempo}-${p.plan}`);
    } else setBusy(false);
  }

  return (
    <div ref={top} className="quiz">
      <div className="progress" aria-label={`${answered}/${questions.length} 응답`}>
        <span style={{ width: `${(answered / questions.length) * 100}%` }} />
      </div>
      <p className="faint">{page + 1} / {pages}쪽</p>
      {list.map((q) => (
        <fieldset key={q.id} className="qitem">
          <legend>{q.id}. {q.text}</legend>
          <div className="likert">
            {scale.map((lab, i) => (
              <label key={i} title={lab} className={`lk lk${i}`}>
                <input type="radio" name={`q${q.id}`} checked={ans[q.id] === i + 1} onChange={() => setAns({ ...ans, [q.id]: i + 1 })} />
                <span className="dot" aria-hidden />
                <span className="lab">{lab}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        {page > 0 && <button type="button" className="btn ghost" onClick={() => setPage(page - 1)}>이전</button>}
        {page < pages - 1 ? (
          <button type="button" className="btn" disabled={!done} onClick={() => setPage(page + 1)}>다음</button>
        ) : (
          <button type="button" className="btn" disabled={!done || busy} onClick={finish}>{busy ? "계산 중" : "결과 보기"}</button>
        )}
      </div>
    </div>
  );
}
