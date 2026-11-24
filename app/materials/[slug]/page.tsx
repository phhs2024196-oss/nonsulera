import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Cover from "@/components/Cover";
import WishButton from "@/components/WishButton";
import { materials, site } from "@/lib/site";

export function generateStaticParams() {
  return materials.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = materials.find((x) => x.slug === slug);
  return m ? { title: `${m.title}(${m.kind})`, description: m.summary } : {};
}

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = materials.find((x) => x.slug === slug);
  if (!m) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: `${m.title}(${m.kind})`,
    description: m.summary,
    inLanguage: "ko",
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: site.name },
    ...(m.updated ? { dateModified: m.updated } : {}),
  };
  return (
    <div className="wrap" style={{ padding: "clamp(36px,6vw,72px) var(--gutter)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="crumb"><Link href="/materials">무료 자료</Link> /</div>
      <div className="book">
        {m.slug === "jipijigi" ? <Cover /> : <div />}
        <div>
          <h1 style={{ fontSize: "clamp(28px,4vw,40px)" }}>{m.title} <span className="muted" style={{ fontWeight: 400, fontSize: "0.5em" }}>({m.kind})</span></h1>
          {m.membersOnly && <p style={{ marginTop: 12 }}><span className="tag st-ok">회원 전용</span> <span className="faint">로그인하면 바로 받을 수 있어요. 가입은 카카오로 10초면 돼요.</span></p>}
          <p className="muted" style={{ marginTop: 16 }}>{m.summary}</p>
          {m.points && <ul>{m.points.map((p) => <li key={p}>{p}</li>)}</ul>}
          {m.file ? (
            <>
              <a className="btn" href={`/download/${m.slug}?from=detail`}>{m.membersOnly ? "로그인하고 PDF 받기" : "PDF 받기"}</a>
              {m.updated && <p className="faint" style={{ marginTop: 12 }}>최종 수정 {m.updated}</p>}
            </>
          ) : (
            <WishButton target={m.slug} label="나오면 받을래요" />
          )}
        </div>
      </div>
    </div>
  );
}
