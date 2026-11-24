"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { causes, causeTip, formName, itemIndex, itemTitle, kstToday, levelDots, noteLabel, shortName, type Item, type Note, type NoteStatus } from "@/lib/notes";

type Props = { item: Item & { s?: string }; school: string; note?: Note; loggedIn: boolean; onSaved: (n: Note | null) => void; showSchool?: boolean; reason?: string };

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export async function saveNote(body: Record<string, unknown>) {
  const r = await fetch("/api/note", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status === 401 ? "login" : "save");
  return (await r.json()).note as Partial<Note> | null;
}

export default function ItemCard({ item: it, school, note: n, loggedIn, onSaved, showSchool, reason }: Props) {
  const [open, setOpen] = useState<"" | "memo" | "sim">("");
  const [msg, setMsg] = useState("");
  const [run, setRun] = useState<number | null>(null);
  const [sec, setSec] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const [picked, setPicked] = useState<string[]>(n?.causes ?? []);
  useEffect(() => () => { if (tick.current) clearInterval(tick.current); }, []);

  const today = kstToday();
  const due = n?.review_at && n.review_at <= today;

  async function send(body: Record<string, unknown>, optimistic?: Note | null) {
    if (!loggedIn) return setMsg("표시와 기록은 로그인하면 저장돼요.");
    const prev = n ?? null;
    if (optimistic !== undefined) onSaved(optimistic);
    try {
      const r = await saveNote({ item: it.id, ...body });
      onSaved(r ? { ...(optimistic ?? prev ?? ({} as Note)), item_id: it.id, school, ...r } as Note : null);
      setMsg("");
    } catch { onSaved(prev); setMsg("저장하지 못했어요. 잠시 뒤 다시 눌러 주세요."); }
  }

  function mark(s: NoteStatus) {
    const next = n?.status === s ? "" : s;
    send({ event: "mark", status: next }, next ? { ...(n ?? { item_id: it.id, school, memo: null, causes: [], time_sec: null, review_step: 0 }), status: next, review_at: null } as Note : null);
    if (next && next !== "solved") setOpen("memo");
  }

  function timer() {
    if (run === null) {
      const start = Date.now(); setSec(0); setRun(start);
      tick.current = setInterval(() => setSec(Math.round((Date.now() - start) / 1000)), 1000);
    } else {
      if (tick.current) clearInterval(tick.current);
      setRun(null);
      if (sec >= 5) send({ event: "time", time: sec });
    }
  }

  const limit = (it.t ?? 0) * 60;
  return (
    <div id={it.id} className={`nitem ${n ? `st-${n.status}` : ""} ${due ? "due" : ""}`}>
      <div className="ni-main">
        <div className="ni-t">
          <b>{showSchool ? `${shortName(it.s ?? school)} ${it.y} ` : ""}{it.et.replace("수시 ", "")}</b> {it.tr && <span className="faint">{it.tr}</span>} <span className="faint">{it.id.split("-").pop()}번</span>
          <span className="lv" title={`난도 ${it.lv}`} aria-label={`난도 4단계 중 ${levelDots(it.lv)}`}>{"●".repeat(levelDots(it.lv))}<i>{"●".repeat(4 - levelDots(it.lv))}</i></span>
        </div>
        <div className="ni-d">{it.u || "단원 미분류"} · {formName[it.f] ?? it.f}{it.p ? ` · ${it.p}점` : ""}{it.t ? ` · 권장 ${it.t}분` : ""}</div>
        {it.tg.length > 0 && <div className="ni-tags">{it.tg.slice(0, 4).map((t) => <span key={t}>{t}</span>)}</div>}
        {reason && <div className="ni-why">{reason}</div>}
        {n && (n.memo || (n.causes?.length ?? 0) > 0 || n.time_sec || n.review_at) && open !== "memo" && (
          <div className="ni-memo">
            {(n.causes ?? []).map((c) => <b key={c} className="cz">{c}</b>)} {n.memo}
            {n.time_sec ? <span className="faint"> · 기록 {mmss(n.time_sec)}{limit ? (n.time_sec <= limit ? " (권장 시간 안)" : ` (권장보다 ${mmss(n.time_sec - limit)} 더)`) : ""}</span> : null}
            {n.review_at && <span className="faint"> · 복습 {due ? "오늘" : n.review_at.slice(5).replace("-", "/")} ({["1주", "3주", "6주"][Math.min(2, n.review_step)]} 차)</span>}
          </div>
        )}
      </div>
      <div className="ni-act">
        {due ? (
          <>
            <button type="button" className="nb on st-solved" onClick={() => send({ event: "review_ok" })}>복습: 맞힘</button>
            <button type="button" className="nb on st-wrong" onClick={() => { send({ event: "review_fail" }); setOpen("memo"); }}>또 틀림</button>
          </>
        ) : (Object.keys(noteLabel) as NoteStatus[]).map((s) => (
          <button key={s} type="button" className={`nb ${n?.status === s ? `on st-${s}` : ""}`} aria-pressed={n?.status === s} onClick={() => mark(s)}>{noteLabel[s]}</button>
        ))}
        <button type="button" className={`nb ghost ${run !== null ? "running" : ""}`} onClick={timer}>{run !== null ? `■ ${mmss(sec)}${limit ? ` / ${it.t}분` : ""}` : "⏱ 시간 재기"}</button>
        <button type="button" className="nb ghost" onClick={() => setOpen(open === "memo" ? "" : "memo")}>메모</button>
        {it.sim.length > 0 && <button type="button" className="nb ghost" onClick={() => setOpen(open === "sim" ? "" : "sim")}>비슷한 기출 {it.sim.length}</button>}
      </div>
      {open === "memo" && (
        <form className="ni-form" onSubmit={(e) => {
          e.preventDefault();
          const memo = String(new FormData(e.currentTarget).get("memo") ?? "");
          send({ event: "memo", memo, causes: picked, status: n?.status ?? "retry" }, { ...(n ?? { item_id: it.id, school, status: "retry", time_sec: null, review_at: null, review_step: 0 }), memo, causes: picked } as Note);
          setOpen("");
        }}>
          <div className="chips">
            {causes.map((c) => (
              <label key={c}><input type="checkbox" checked={picked.includes(c)} onChange={() => setPicked(picked.includes(c) ? picked.filter((x) => x !== c) : [...picked, c])} />{c}</label>
            ))}
          </div>
          {picked.length > 0 && <p className="faint">{causeTip[picked[picked.length - 1]]}</p>}
          <textarea name="memo" defaultValue={n?.memo ?? ""} maxLength={1000} rows={2} placeholder="어디서 막혔나요? 예: (2)에서 x=0 경우를 빠뜨림" />
          <button className="btn" type="submit">저장</button>
        </form>
      )}
      {open === "sim" && (
        <div className="ni-sim">
          <p className="faint">같은 핵심 아이디어나 소재를 쓰는 기출이에요. 다른 학교 문제로 같은 생각을 한 번 더 연습해요.</p>
          {it.sim.map((s) => {
            const o = itemIndex[s];
            return o ? <Link key={s} href={`/notes/${o.s}#${s}`}><b>{itemTitle(s)}</b> <span className="faint">{o.u} · {formName[o.f] ?? o.f}{o.tg.length ? ` · ${o.tg.slice(0, 2).join(", ")}` : ""}</span></Link> : null;
          })}
        </div>
      )}
      {msg && <p className="faint ni-msg" role="status">{msg} {!loggedIn && <Link href={`/login?next=/notes/${school}`}>로그인</Link>}</p>}
    </div>
  );
}
