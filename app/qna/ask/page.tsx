import Link from "next/link";
import type { Metadata } from "next";
import AskForm from "./AskForm";
import { currentUser, userClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "질문하기", robots: { index: false } };

const kst = (s: string) => new Date(s).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });

export default async function Ask() {
  const user = await currentUser();
  let mine: { id: number; topic: string; body: string; answer: string | null; status: string; created_at: string; is_public: boolean }[] = [];
  if (user) {
    const sb = await userClient();
    mine = ((await sb?.from("questions").select("id, topic, body, answer, status, created_at, is_public").eq("user_id", user.id).order("created_at", { ascending: false }))?.data ?? []) as typeof mine;
  }
  return (
    <div className="wrap article" style={{ maxWidth: 760 }}>
      <div className="crumb"><Link href="/qna">묻고 답하기</Link> /</div>
      <h1>질문하기</h1>
      <p className="muted">
        학교 고르기, 수능 최저, 기출 풀이처럼 수리논술에 관한 건 무엇이든 받아요. 답은 대학 공개 자료와 기출 DB를 확인해서 쓰기 때문에 보통 하루에서 사흘 걸려요.
        답이 달리면 이 페이지와 내 기록에서 볼 수 있어요.
      </p>
      {user ? <AskForm /> : <p><Link className="btn" href="/login?next=/qna/ask">로그인하고 질문하기</Link></p>}
      {mine.length > 0 && (
        <>
          <h2 className="rh">내 질문</h2>
          <div className="qa-mine">
            {mine.map((q) => (
              <article key={q.id} className={`qa-item ${q.status}`}>
                <div className="faint">{kst(q.created_at)} · {q.topic}{q.is_public ? " · 공개" : " · 비공개"} · {q.status === "answered" ? "답변 완료" : q.status === "closed" ? "닫힘" : "답변 준비 중"}</div>
                <p className="qa-q">{q.body}</p>
                {q.answer && <div className="qa-a"><b>답</b><p>{q.answer}</p></div>}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
