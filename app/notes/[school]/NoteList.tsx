"use client";
import { useMemo, useState } from "react";
import ItemCard from "../ItemCard";
import { formName, kstToday, type Item, type Note } from "@/lib/notes";

export default function NoteList({ school, items, initial, loggedIn }: { school: string; items: Item[]; initial: Note[]; loggedIn: boolean }) {
  const [notes, setNotes] = useState<Record<string, Note>>(Object.fromEntries(initial.map((n) => [n.item_id, n])));
  const [filter, setFilter] = useState<"all" | "todo" | "again" | "due">("all");
  const [unit, setUnit] = useState("");
  const [form, setForm] = useState("");
  const today = kstToday();

  const units = useMemo(() => [...new Set(items.map((it) => it.u.split(" > ")[0]).filter(Boolean))], [items]);
  const forms = useMemo(() => [...new Set(items.map((it) => it.f).filter(Boolean))], [items]);
  const years = useMemo(() => {
    const shown = items.filter((it) => {
      const n = notes[it.id];
      if (unit && !it.u.startsWith(unit)) return false;
      if (form && it.f !== form) return false;
      if (filter === "todo") return !n;
      if (filter === "again") return n && n.status !== "solved";
      if (filter === "due") return n?.review_at && n.review_at <= today;
      return true;
    });
    const m = new Map<number, Item[]>();
    shown.forEach((it) => m.set(it.y, [...(m.get(it.y) ?? []), it]));
    return [...m.entries()];
  }, [items, notes, filter, unit, form, today]);

  const vals = Object.values(notes);
  const set = (id: string) => (n: Note | null) => setNotes((cur) => { const x = { ...cur }; if (n) x[id] = n; else delete x[id]; return x; });

  return (
    <>
      <div className="note-bar">
        <span><b>{vals.length}</b> / {items.length} 표시</span>
        <span>다시 볼 문항 <b className="hot">{vals.filter((n) => n.status !== "solved").length}</b></span>
        <span>오늘 복습 <b className="hot">{vals.filter((n) => n.review_at && n.review_at <= today).length}</b></span>
        <div className="chips">
          {(["all", "todo", "again", "due"] as const).map((f) => (
            <label key={f}><input type="radio" name="f" checked={filter === f} onChange={() => setFilter(f)} />{{ all: "전체", todo: "안 푼 문항", again: "다시 볼 문항", due: "오늘 복습" }[f]}</label>
          ))}
        </div>
        <div className="note-sel">
          <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="과목"><option value="">과목 전체</option>{units.map((u) => <option key={u}>{u}</option>)}</select>
          <select value={form} onChange={(e) => setForm(e.target.value)} aria-label="풀이 형태"><option value="">풀이 형태 전체</option>{forms.map((f) => <option key={f} value={f}>{formName[f] ?? f}</option>)}</select>
        </div>
      </div>
      {years.length === 0 && <p className="muted">이 조건에 맞는 문항이 없어요.</p>}
      {years.map(([y, list]) => (
        <section key={y}>
          <h2 className="rh">{y}학년도</h2>
          <div className="nitems">
            {list.map((it) => <ItemCard key={it.id} item={it} school={school} note={notes[it.id]} loggedIn={loggedIn} onSaved={set(it.id)} />)}
          </div>
        </section>
      ))}
    </>
  );
}
