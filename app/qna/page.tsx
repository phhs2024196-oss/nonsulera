import Link from "next/link";
import type { Metadata } from "next";
import { qna } from "@/lib/qna";

export const metadata: Metadata = { title: "묻고 답하기", description: "수리논술에 대해 수험생이 가장 많이 묻는 질문과, 대학 공개 자료에 근거한 답." };

export default function QnaIndex() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qna.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.short } })),
  };
  return (
    <div className="wrap article" style={{ maxWidth: 820 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1>묻고 답하기</h1>
      <p className="muted">모든 답에는 근거 자료를 밝혀 두었어요.</p>
      <ul className="qlist">
        {qna.map((x) => (
          <li key={x.slug}><Link href={`/qna/${x.slug}`}><span className="qm">문</span><span>{x.q}</span></Link></li>
        ))}
      </ul>
    </div>
  );
}
