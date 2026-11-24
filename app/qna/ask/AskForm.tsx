"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const topics = ["학교 고르기", "수능 최저", "공부 순서", "기출 풀이", "답안 쓰기", "교재", "기타"];

export default function AskForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await fetch("/api/question", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: f.get("topic"), body: f.get("body"), public: f.get("public") === "on" }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { (e.target as HTMLFormElement).reset(); setMsg("받았어요. 답이 달리면 아래 '내 질문'에 보여요."); router.refresh(); }
    else setMsg(j.error === "short" ? "10자 이상 적어 주세요." : j.error === "many" ? "질문은 하루 5개까지 받아요." : "보내지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  }
  return (
    <form className="ask" onSubmit={submit}>
      <label className="f">주제
        <select name="topic" defaultValue="학교 고르기">{topics.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="f">질문
        <textarea name="body" rows={6} minLength={10} maxLength={3000} required
          placeholder="예: 수학 3등급, 영어 2등급이에요. 최저 2합 5인 학교 중 기하가 안 나오는 곳이 있을까요?" />
      </label>
      <label className="check"><input type="checkbox" name="public" defaultChecked />답이 달리면 이름을 빼고 다른 학생들도 볼 수 있게 공개해도 좋아요</label>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
        <button className="btn" disabled={busy}>{busy ? "보내는 중" : "질문 보내기"}</button>
        {msg && <span className="faint" role="status">{msg}</span>}
      </div>
    </form>
  );
}
