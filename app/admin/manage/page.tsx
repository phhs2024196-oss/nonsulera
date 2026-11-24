import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { userClient } from "@/lib/supabase/server";
import { schools } from "@/lib/diag";

export const metadata: Metadata = { title: "관리자 · 질문·소식", robots: { index: false } };
export const dynamic = "force-dynamic";

type R = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const kst = (s: string) => new Date(s).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

async function answer(fd: FormData) {
  "use server";
  const sb = await userClient();
  await sb?.rpc("admin_answer", {
    p_id: Number(fd.get("id")), p_answer: String(fd.get("answer") ?? ""),
    p_public: fd.get("public") === "on", p_status: fd.get("close") === "on" ? "closed" : null,
  });
  revalidatePath("/admin/manage"); revalidatePath("/qna");
}

async function notice(fd: FormData) {
  "use server";
  const sb = await userClient();
  const list = fd.get("school") === "ALL" ? schools.map((s) => s.code) : [String(fd.get("school"))];
  for (const code of list) {
    await sb?.rpc("admin_notice", { p_school: code, p_title: String(fd.get("title") ?? ""), p_body: String(fd.get("body") ?? ""), p_url: String(fd.get("url") ?? "") });
  }
  revalidatePath("/admin/manage");
}

export default async function Manage() {
  const sb = await userClient();
  if (!sb) notFound();
  const { data: st, error } = await sb.rpc("admin_members_stats");
  if (error || !st) notFound();
  const qs = st.questions as R[];
  const open = qs.filter((q) => q.status === "open");
  return (
    <div className="wrap admin" style={{ padding: "40px var(--gutter)", maxWidth: 980 }}>
      <p><Link href="/admin">← 관리자 대시보드</Link></p>
      <h1 style={{ fontSize: 28 }}>질문 답변 · 학교 소식</h1>

      <section className="abox wide">
        <h2>답변 기다리는 질문 {open.length}개</h2>
        {qs.length === 0 && <p className="faint">아직 받은 질문이 없어요.</p>}
        {qs.map((q) => (
          <form key={q.id} action={answer} className={`mq ${q.status}`}>
            <input type="hidden" name="id" value={q.id} />
            <div className="faint">#{q.id} · {kst(q.created_at)} · {q.nickname ?? "회원"} · {q.topic} · {q.status === "open" ? "대기" : q.status === "answered" ? "답변 완료" : "닫힘"}</div>
            <p className="qa-q">{q.body}</p>
            <textarea name="answer" rows={4} defaultValue={q.answer ?? ""} placeholder="답변(대학 자료·기출 DB 근거를 함께 적기)" />
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <label className="check"><input type="checkbox" name="public" defaultChecked={q.is_public} />묻고 답하기에 공개(질문자가 동의한 경우만)</label>
              <label className="check"><input type="checkbox" name="close" />답 없이 닫기</label>
              <button className="btn">저장</button>
            </div>
          </form>
        ))}
      </section>

      <section className="abox wide">
        <h2>학교 소식 올리기</h2>
        <p className="faint">올린 소식은 그 학교를 찜한 회원의 &apos;내 기록 → 내 대학 소식&apos;에 바로 떠요. 메일 발송은 메일 서버 연결 후에 붙여요.</p>
        <form action={notice} className="ask">
          <label className="f">학교
            <select name="school" defaultValue="ALL">
              <option value="ALL">전체 학교({schools.length}곳)</option>
              {schools.map((s) => <option key={s.code} value={s.code}>{s.short}</option>)}
            </select>
          </label>
          <label className="f">제목<input name="title" required maxLength={120} placeholder="예: 2028학년도 모집요강 발표" /></label>
          <label className="f">내용<textarea name="body" rows={3} maxLength={2000} placeholder="예: 논술 9월 27일, 수능최저 2합 5 유지" /></label>
          <label className="f">원문 링크<input name="url" type="url" placeholder="https://" /></label>
          <button className="btn">올리기</button>
        </form>
        <table className="stat" style={{ marginTop: 16 }}>
          <thead><tr><th>올린 때</th><th>학교</th><th>제목</th></tr></thead>
          <tbody>
            {(st.notices as R[]).length === 0 && <tr><td colSpan={3} className="faint">아직 없어요</td></tr>}
            {(st.notices as R[]).map((n) => <tr key={n.id}><td>{kst(n.created_at)}</td><td>{schools.find((s) => s.code === n.school)?.short ?? n.school}</td><td>{n.title}</td></tr>)}
          </tbody>
        </table>
      </section>
    </div>
  );
}
