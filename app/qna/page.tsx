import Link from "next/link";
import type { Metadata } from "next";
import { qna } from "@/lib/qna";
import { anonClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "묻고 답하기", description: "수리논술에 대해 수험생이 가장 많이 묻는 질문과, 대학 공개 자료에 근거한 답." };

export const revalidate = 300;

export default async function QnaIndex() {
  const sb = anonClient();
  const asked = ((await sb?.from("questions").select("id, topic, body, answer, answered_at").eq("status", "answered").eq("is_public", true).order("answered_at", { ascending: false }).limit(30))?.data ?? []) as { id: number; topic: string; body: string; answer: string; answered_at: string }[];
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qna.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.short } })),
  };
  return (
    <div className="wrap article" style={{ maxWidth: 820 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1>묻고 답하기</h1>
      <p className="muted">모든 답에는 근거 자료를 밝혀 두었어요. 여기 없는 건 <Link href="/qna/ask">직접 물어보세요</Link>. 회원이면 누구나 질문할 수 있어요.</p>
      <ul className="qlist">
        {qna.map((x) => (
          <li key={x.slug}><Link href={`/qna/${x.slug}`}><span className="qm">문</span><span>{x.q}</span></Link></li>
        ))}
      </ul>
      <h2 className="rh">회원 질문과 답</h2>
      {asked.length ? (
        <div className="qa-mine">
          {asked.map((q) => (
            <details key={q.id} className="qa-item">
              <summary><span className="faint">{q.topic}</span> {q.body.length > 70 ? `${q.body.slice(0, 70)}…` : q.body}</summary>
              <p className="qa-q">{q.body}</p>
              <div className="qa-a"><b>답</b><p>{q.answer}</p></div>
            </details>
          ))}
        </div>
      ) : <p className="muted">첫 질문을 받고 있어요. <Link href="/qna/ask">질문하기</Link></p>}
      <p style={{ marginTop: 20 }}><Link className="btn" href="/qna/ask">질문하기</Link></p>
    </div>
  );
}
