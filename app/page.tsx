/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Cover from "@/components/Cover";
import WishButton from "@/components/WishButton";
import { books, materials } from "@/lib/site";
import { qna } from "@/lib/qna";
import { types } from "@/lib/test";

export default function Home() {
  const jj = materials[0];
  return (
    <>
      <div className="wrap">
        <section className="hero">
          <div>
            <div className="kicker sans">수리논술만 다룹니다</div>
            <h1>
              수학적 사고력으로 풀고,<br />
              그 풀이를 <em>논리적인 말</em>로 바꾼다.
            </h1>
            <p className="lead">
              무조건 논술하라고 말하지 않아요. 대학이 공개한 숫자와 대학이 직접 쓴 문장을 보여 드리고, 판단은 여러분이 하게 해요.
              내신과 수능에 지장 없이, 효율적으로.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <a className="btn" href={`/download/${jj.slug}?from=home-hero`}>지피지기 무료로 받기</a>
              <Link className="btn ghost" href="/test">내 논술 유형 검사 (3분)</Link>
            </div>
          </div>
          <div className="mark">
            <img src="/brand/logo_main.png" alt="논술의 시대 로고" width={787} height={468} />
          </div>
        </section>
      </div>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head"><span className="no">一</span><h2>숫자로 먼저 말할게요</h2></div>
          <div className="figures">
            <div className="fig">
              <div className="n">1.65<small>등급</small></div>
              <p>같은 대학 안에서 논술 합격자 내신이 교과 합격자보다 평균 이만큼 낮았어요.</p>
              <div className="src">2026학년도 자연계, 두 전형 내신을 모두 공개한 23개교. 9등급제 기준.</div>
            </div>
            <div className="fig">
              <div className="n">40<small>/ 43곳</small></div>
              <p>"교과 개념을 정확히 이해했는가"를 본다고 출제 의도에 적은 대학.</p>
              <div className="src">선행학습 영향평가 보고서 2024~2026, 수학 문항 707개.</div>
            </div>
            <div className="fig">
              <div className="n">35<small>곳</small></div>
              <p>단계마다 점수를 준다고 밝힌 대학. 과정이 곧 점수예요.</p>
              <div className="src">같은 보고서의 채점 기준.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head"><span className="no">二</span><h2>첫 책은 무료예요</h2></div>
          <div className="book">
            <Cover />
            <div>
              <h3 style={{ fontSize: 24, marginBottom: 6 }}>{jj.title} <span className="muted" style={{ fontWeight: 400, fontSize: 17 }}>({jj.kind})</span></h3>
              <p className="muted">{jj.summary}</p>
              <ul>{jj.points?.map((p) => <li key={p}>{p}</li>)}</ul>
              <a className="btn" href={`/download/${jj.slug}?from=home-book`}>PDF 받기</a>
              <p className="faint" style={{ marginTop: 12 }}>회원가입 없이 바로 받을 수 있어요.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec test-band">
        <div className="wrap">
          <div className="sec-head"><span className="no">三</span><h2>나는 어떤 논술형일까</h2></div>
          <p className="muted" style={{ maxWidth: "36em" }}>24문항, 3분. 생각하는 방식·답안 쓰는 방식·푸는 속도·입시 전략으로 16가지 유형을 나누고, 유형마다 점수가 새는 곳과 준비 순서를 알려 드려요.</p>
          <div className="typegrid" style={{ margin: "20px 0 24px" }}>
            {["SEQA", "VBQA", "SBDH", "VEDA"].map((c) => (
              <Link key={c} href={`/test/result/${c}`}><span className="brush">{types[c].name}</span><span className="faint">{c}</span></Link>
            ))}
          </div>
          <Link className="btn" href="/test">검사 시작하기</Link>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head"><span className="no">四</span><h2>준비 중인 책</h2></div>
          <p className="muted" style={{ maxWidth: "36em" }}>먼저 나왔으면 하는 책에 표시해 주세요. 많이 기다리는 책부터 만들어요.</p>
          <div className="rows">
            {books.slice(0, 5).map((b) => (
              <div className="row" key={b.key}>
                <div><span className="t brush">{b.title}</span> <span className="k">({b.kind})</span></div>
                <WishButton target={b.key} />
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16 }}><Link href="/books">교재 전체 보기</Link></p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head"><span className="no">五</span><h2>많이 묻는 질문</h2></div>
          <ul className="qlist">
            {qna.slice(0, 5).map((x) => (
              <li key={x.slug}><Link href={`/qna/${x.slug}`}><span className="qm">문</span><span>{x.q}</span></Link></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
