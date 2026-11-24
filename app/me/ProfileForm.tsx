"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";

type P = { nickname: string; grade: string; target_schools: string[]; strengths: string[]; wanted_books: string[]; marketing_ok: boolean };

export default function ProfileForm({ initial, grades, strengths, books }: { initial: P; grades: string[]; strengths: string[]; books: { key: string; title: string; kind: string }[] }) {
  const [p, setP] = useState<P>(initial);
  const [schools, setSchools] = useState(initial.target_schools.join(", "));
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const toggle = (k: "strengths" | "wanted_books", v: string) =>
    setP((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...p, target_schools: schools.split(/[,\s]+/).filter(Boolean) }),
    });
    setMsg(res.ok ? "저장했어요." : "저장하지 못했어요. 잠시 뒤 다시 해 주세요.");
  }
  async function logout() {
    await browserClient()?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <form className="form" onSubmit={save}>
      <label className="f">부를 이름
        <input type="text" value={p.nickname} maxLength={20} onChange={(e) => setP({ ...p, nickname: e.target.value })} />
      </label>
      <fieldset className="f" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>지금 나는</legend>
        <div className="chips">
          {grades.map((g) => (
            <label key={g}><input type="radio" name="grade" checked={p.grade === g} onChange={() => setP({ ...p, grade: g })} />{g}</label>
          ))}
        </div>
      </fieldset>
      <label className="f">가고 싶은 학교 <span className="faint" style={{ fontWeight: 400 }}>(쉼표로 구분, 최대 6곳)</span>
        <input type="text" value={schools} onChange={(e) => setSchools(e.target.value)} placeholder="예: 성균관대, 중앙대" />
      </label>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>자신 있는 과목</legend>
        <div className="chips">
          {strengths.map((s) => (
            <label key={s}><input type="checkbox" checked={p.strengths.includes(s)} onChange={() => toggle("strengths", s)} />{s}</label>
          ))}
        </div>
      </fieldset>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>먼저 받고 싶은 책</legend>
        <div className="chips">
          {books.map((b) => (
            <label key={b.key}><input type="checkbox" checked={p.wanted_books.includes(b.key)} onChange={() => toggle("wanted_books", b.key)} />{b.title}({b.kind})</label>
          ))}
        </div>
      </fieldset>
      <label className="check">
        <input type="checkbox" checked={p.marketing_ok} onChange={(e) => setP({ ...p, marketing_ok: e.target.checked })} />
        <span>새 책·학교편 출간 소식을 이메일로 받을게요. (선택)</span>
      </label>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="btn" type="submit">저장</button>
        <button className="btn ghost" type="button" onClick={logout}>로그아웃</button>
      </div>
      {msg && <p className="note" role="status">{msg}</p>}
    </form>
  );
}
