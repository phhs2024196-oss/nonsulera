import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { qna } from "@/lib/qna";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return qna.map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const x = qna.find((y) => y.slug === slug);
  return x ? { title: x.q, description: x.short, alternates: { canonical: `/qna/${x.slug}` } } : {};
}

export default async function QnaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const x = qna.find((y) => y.slug === slug);
  if (!x) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: x.q,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: [x.short, ...x.body].join(" "),
        dateModified: x.updated,
        author: { "@type": "Organization", name: site.name, url: site.url },
      },
    },
  };
  const others = qna.filter((y) => y.slug !== x.slug).slice(0, 4);
  return (
    <div className="wrap">
      <article className="article">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <div className="crumb"><Link href="/qna">묻고 답하기</Link> /</div>
        <h1>{x.q}</h1>
        <p className="answer">{x.short}</p>
        {x.body.map((p, i) => <p key={i}>{p}</p>)}
        <p style={{ marginTop: 28 }}>
          더 자세한 내용은 무료 총론 <Link href="/materials/jipijigi">지피지기(수리논술 총론)</Link>에 있어요.
        </p>
        <div className="sources">
          <strong>근거</strong>
          <ul style={{ margin: "6px 0 8px", paddingLeft: "1.1em" }}>{x.sources.map((s) => <li key={s}>{s}</li>)}</ul>
          최종 확인 {x.updated} · 논술의 시대
        </div>
        <h2 style={{ fontSize: 18, margin: "48px 0 8px" }}>다른 질문</h2>
        <ul className="qlist">
          {others.map((o) => <li key={o.slug}><Link href={`/qna/${o.slug}`}><span className="qm">문</span><span>{o.q}</span></Link></li>)}
        </ul>
      </article>
    </div>
  );
}
