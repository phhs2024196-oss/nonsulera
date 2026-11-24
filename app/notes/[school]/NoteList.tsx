"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formName, noteLabel, type Item, type NoteStatus } from "@/lib/notes";

type N = { status: string; memo: string | null };

export default function NoteList({ school, items, initial, loggedIn }: { school: string; items: Item[]; initial: Record<string, N>; loggedIn: boolean }) {
  const [notes, setNotes] = useState(initial);
  const [filter, setFilter] = useState<"all" | "todo" | "again">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const years = useMemo(() => {
    const shown = items.filter((it) => filter === "all" || (filter === "todo" ? !notes[it.id] : ["wrong", "retry"].includes(notes[it.id]?.status)));
    const m = new Map<number, Item[]>();
    shown.forEach((it) => m.set(it.y, [...(m.get(it.y) ?? []), it]));
    return [...m.entries()];
  }, [items, notes, filter]);

  async function save(id: string, status: string, memo: string | null) {
    if (!loggedIn) return setMsg("표시와 메모는 로그인하면 저장돼요.");
    const prev = notes;
    const next = { ...notes };
    if (status) next[id] = { status, memo }; else delete next[id];
    setNotes(next);
    const r = await fetch("/api/note", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ school, item: id, status, memo }) });
    if (!r.ok) { setNotes(prev); setMsg("저장하지 못했어요. 잠시 뒤 다시 눌러 주세요."); } else setMsg("");
  }

  const done = Object.keys(notes).length;
  const again = Object.values(notes).filter((n) => n.status !== "solved").length;

  return (
    <>
      <div className="note-bar">
        <span><b>{done}</b> / {items.length} 표시</span>
        <span>다시 볼 문항 <b className="hot">{again}</b></span>
        <div className="chips">
          {(["all", "todo", "again"] as const).map((f) => (
            <label key={f}><input type="radio" name="f" checked={filter === f} onChange={() => setFilter(f)} />{{ all: "전체", todo: "안 푼 문항", again: "다시 볼 문항" }[f]}</label>
          ))}
        </div>
      </div>
      {!loggedIn && <p className="faint"><Link href={`/login?next=/notes/${school}`}>로그인</Link>하면 표시와 메모가 저장돼요.</p>}
      {msg && <p className="faint" role="status">{msg}</p>}
      {years.length === 0 && <p className="muted">이 조건에 맞는 문항이 없어요.</p>}
      {years.map(([y, list]) => (
        <section key={y}>
          <h2 className="rh">{y}학년도</h2>
          <div className="nitems">
            {list.map((it) => {
              const n = notes[it.id];
              return (
                <div key={it.id} className={`nitem ${n ? `st-${n.status}` : ""}`}>
                  <div className="ni-main">
                    <div className="ni-t"><b>{it.et.replace("수시 ", "")} {it.tr && <span className="faint">{it.tr}</span>}</b> <span className="faint">{it.id.split("-").pop()}번</span></div>
                    <div className="ni-d">{it.u || "단원 미분류"} · {formName[it.f] ?? it.f}{it.p ? ` · ${it.p}점` : ""}{it.t ? ` · 권장 ${it.t}분` : ""}</div>
                    {n?.memo && open !== it.id && <p className="ni-memo">{n.memo}</p>}
                  </div>
                  <div className="ni-act">
                    {(Object.keys(noteLabel) as NoteStatus[]).map((s) => (
                      <button key={s} type="button" className={`nb ${n?.status === s ? `on st-${s}` : ""}`} aria-pressed={n?.status === s}
                        onClick={() => save(it.id, n?.status === s ? "" : s, n?.memo ?? null)}>{noteLabel[s]}</button>
                    ))}
                    <button type="button" className="nb ghost" onClick={() => setOpen(open === it.id ? null : it.id)}>메모</button>
                  </div>
                  {open === it.id && (
                    <form className="ni-form" onSubmit={(e) => { e.preventDefault(); const memo = String(new FormData(e.currentTarget).get("memo") ?? ""); save(it.id, n?.status ?? "retry", memo); setOpen(null); }}>
                      <textarea name="memo" defaultValue={n?.memo ?? ""} maxLength={1000} rows={3} placeholder="어디서 막혔나요? 예: (2)에서 x=0 경우를 빠뜨림" />
                      <button className="btn" type="submit">저장</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
