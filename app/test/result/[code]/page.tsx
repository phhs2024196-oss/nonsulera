import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import Bars from "./Bars";
import Share from "./Share";
import { axes, poleInfo, typeCodes, types, type Pole } from "@/lib/test";

export function generateStaticParams() {
  return typeCodes.map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const t = types[code];
  return t ? { title: `${t.name}(${code}) · 논술 유형`, description: t.line } : {};
}

export default async function Result({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const t = types[code];
  if (!t) notFound();
  const poles = code.split("") as Pole[];
  const [think, write, tempo, plan] = poles.map((p) => poleInfo[p]);
  const books = [write.book, think.book, tempo.book, plan.book];
  return (
    <div className="wrap article" style={{ maxWidth: 820 }}>
      <div className="crumb"><Link href="/test">논술 유형 검사</Link> /</div>
      <div className="result-head">
        <div className="faint sans" style={{ letterSpacing: ".12em" }}>{code} · {poles.map((p) => poleInfo[p].label).join(" · ")}</div>
        <h1 className="brush result-name">{t.name}</h1>
        <div className="result-hanja" aria-hidden>{t.hanja}</div>
        <p className="answer" style={{ marginTop: 18 }}>{t.line}</p>
      </div>

      <Suspense fallback={null}><Bars code={code} /></Suspense>

      <h2 className="rh">이런 힘이 있어요</h2>
      <ul>{poles.map((p) => <li key={p}>{poleInfo[p].strength}</li>)}</ul>

      <h2 className="rh">여기서 점수가 새요</h2>
      <ul>{poles.map((p) => <li key={p}>{poleInfo[p].risk}</li>)}</ul>

      <h2 className="rh">이렇게 준비하세요</h2>
      <ol>{poles.map((p) => <li key={p}>{poleInfo[p].tip}</li>)}</ol>

      <h2 className="rh">잘 맞는 시험</h2>
      <ul>{[think, tempo, plan, write].map((x) => <li key={x.label}>{x.fit}</li>)}</ul>

      <h2 className="rh">먼저 볼 책</h2>
      <div className="rows">
        {books.map((b) => (
          <div className="row" key={b.title}><div><span className="t brush">{b.title}</span> <span className="k">({b.kind})</span></div></div>
        ))}
      </div>
      <p className="faint" style={{ marginTop: 10 }}>모든 유형의 첫걸음은 무료 총론 지피지기(수리논술 총론)예요.</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
        <a className="btn" href="/download/jipijigi?from=test-result">지피지기 무료로 받기</a>
        <Share title={`나의 논술 유형: ${t.name}`} />
        <Link className="btn ghost" href="/test">다시 검사하기</Link>
      </div>
      <p className="faint" style={{ marginTop: 40 }}>
        이 검사는 공부 방향을 잡기 위한 참고용이에요. 축마다 {axes.map((a) => a.name).join(", ")}을 6문항씩 물어 더 가까운 쪽으로 나눴어요.
      </p>
    </div>
  );
}
