import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import Bars from "./Bars";
import Share from "./Share";
import Evidence from "./Evidence";
import { axes, clarity, poleInfo, typeCodes, types, type Pole } from "@/lib/test";

export function generateStaticParams() {
  return typeCodes.map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const t = types[code];
  return t ? { title: `${t.name}(${code}) · 논술 유형`, description: t.line } : {};
}

export default async function Result({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ v?: string }> }) {
  const { code } = await params;
  const v = (await searchParams).v?.split("-").map(Number);
  const mine = v?.length === 4 && v.every((x) => x >= 0 && x <= 100) ? v : null;
  const t = types[code];
  if (!t) notFound();
  const poles = code.split("") as Pole[];
  const [think, write, tempo, plan] = poles.map((p) => poleInfo[p]);
  const books = [write.book, think.book, tempo.book, plan.book];
  // 50:50에 가까운 축은 반대쪽 처방도 같이 보여 준다
  const edge = mine ? axes.map((ax, i) => ({ ax, i, pct: mine[i] })).filter((x) => clarity(x.pct) === "경계") : [];
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
      {edge.map(({ ax, i, pct }) => {
        const other = ax.poles.find((p) => p !== poles[i])!;
        const a = ax.poles[0] === poles[i] ? pct : 100 - pct;
        return (
          <p key={ax.key} className="edge">
            <b>{ax.name}</b>은 {poleInfo[poles[i]].label} {a} : {poleInfo[other].label} {100 - a}로 거의 반반이에요. {poleInfo[other].label} 처방도 같이 보세요. {poleInfo[other].tip}
          </p>
        );
      })}

      <h2 className="rh">숫자로 본 잘 맞는 시험</h2>
      {poles.map((p) => <Evidence key={p} pole={p} />)}

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
        검사는 {axes.map((a) => a.name).join(", ")} 네 축을 6문항씩(양쪽 3문항씩) 5점 척도로 물어요. 축마다 두 쪽 점수의 비율로 유형을 정하고, 비율이 50:50에 가까운 축(43~57%)은 '경계'로 표시해요. 경계인 축은 다시 검사하면 바뀔 수 있어요. 학교 숫자는 결과 아래 출처 데이터에서 가져왔고, 지원 전에는 그해 모집요강을 꼭 다시 확인하세요.
      </p>
    </div>
  );
}
