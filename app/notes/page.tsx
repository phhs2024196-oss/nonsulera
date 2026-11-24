import Link from "next/link";
import type { Metadata } from "next";
import Hub from "./Hub";
import Bars from "./Bars";
import ReportToast from "./ReportToast";
import { currentUser, userClient } from "@/lib/supabase/server";
import { bookSources, causeTip, pastItems, pastSchools, plannedBooks, shortName, weakness, type Note } from "@/lib/notes";
import { REPORT_STEP, badCount } from "@/lib/report";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "기출 오답 노트",
  description: "44개 대학 수리논술 기출 2,240문항(2021~2027학년도)에 풀었음·틀림·다시 풀기, 틀린 이유, 1·3·6주 복습 일정, 실전 타이머를 남기는 오답 노트.",
};

export default async function Notes() {
  const user = await currentUser();
  let mine: Note[] = [];
  let reports: { id: number; level: number; seen: boolean }[] = [];
  if (user) {
    const sb = await userClient();
    mine = ((await sb?.from("item_notes").select("item_id, school, status, memo, causes, time_sec, review_at, review_step, updated_at"))?.data ?? []) as Note[];
    reports = ((await sb?.from("weak_reports").select("id, level, seen").order("level", { ascending: false }))?.data ?? []) as typeof reports;
  }
  const bad = badCount(mine);
  const nextAt = (Math.floor(bad / REPORT_STEP) + 1) * REPORT_STEP;
  const by = (code: string, bad?: boolean) => mine.filter((m) => m.school === code && (!bad || m.status !== "solved")).length;
  const total = pastSchools.reduce((a, c) => a + pastItems[c].length, 0);
  const started = pastSchools.filter((c) => by(c) > 0);
  void pastItems;
  const rest = pastSchools.filter((c) => by(c) === 0);
  const w = weakness(mine);
  const topCause = w.cause[0]?.[0];

  return (
    <div className="wrap article" style={{ maxWidth: 900 }}>
      <h1>기출 오답 노트</h1>
      <p className="muted">
        {pastSchools.length}개 대학, 2021~2027학년도 수리논술 {total.toLocaleString("ko-KR")}문항의 목록이에요. 문항마다 단원, 풀이 형태, 요소·소재, 난도, 권장 시간을 붙여 뒀어요.
        틀린 문항은 1주·3주·6주 뒤에 다시 보여 주고, 같은 아이디어를 쓰는 다른 학교 기출을 이어서 추천해요.
      </p>
      <p className="faint">문제지는 각 대학 입학처의 논술 기출 자료실에서 받아 풀어요. 여기에는 문항 목록과 분류만 있어요.</p>

      {user ? (
        <>
          <div className="note-kpis">
            <div><b>{mine.length}</b><span>표시한 문항</span></div>
            <div><b className="hot">{mine.filter((m) => m.status !== "solved").length}</b><span>다시 볼 문항</span></div>
            <div><b>{mine.filter((m) => m.review_step >= 3).length}</b><span>복습 졸업</span></div>
            <div><b>{started.length}</b><span>푼 학교</span></div>
          </div>
          {reports[0] ? (
            <Link className="report-banner" href={`/notes/report/${reports[0].id}`}>
              {reports[0].seen ? "최근 약점 리포트" : <b>새 약점 리포트가 나왔어요</b>} · 다시 볼 문항 {reports[0].level}개 기준 · 다음 리포트는 {nextAt}개에서
            </Link>
          ) : (
            <p className="faint">다시 볼 문항이 {REPORT_STEP}개가 되면 약점 리포트를 만들어 드려요. 지금 {bad}개예요.</p>
          )}
          <Hub initial={mine} />
          <ReportToast />

          {mine.length >= 3 && (
            <>
              <h2 className="rh">내 약점</h2>
              {w.unit.some((u) => u.bad > 0) ? (
                <figure className="ev">
                  <figcaption>{w.unit[0].k}에서 가장 많이 틀렸어요 ({w.unit[0].bad}/{w.unit[0].n}문항)</figcaption>
                  <Bars rows={w.unit.filter((u) => u.bad > 0).map((u) => ({ k: u.k, v: u.bad, sub: `/${u.n} · ${u.pct}%` }))} unit="문항" />
                  <p className="ev-note">표시한 문항 중 틀림·다시 풀기와 복습에서 한 번이라도 틀린 문항 수예요.</p>
                </figure>
              ) : <p className="muted">표시한 문항을 모두 맞혔어요. 난도 ●●●● 문항이나 다른 학교로 넓혀 보세요.</p>}
              {w.form.some((f) => f.bad > 0) && (
                <figure className="ev">
                  <figcaption>풀이 형태로 보면 {w.form[0].k} 문항이 약해요</figcaption>
                  <Bars rows={w.form.filter((f) => f.bad > 0).map((f) => ({ k: f.k, v: f.bad, sub: `/${f.n}` }))} unit="문항" />
                </figure>
              )}
              {w.cause.length > 0 && (
                <figure className="ev">
                  <figcaption>틀린 이유 1위는 &apos;{topCause}&apos;예요</figcaption>
                  <Bars rows={w.cause.map(([k, v]) => ({ k, v }))} unit="번" />
                  <p className="ev-note">이렇게 해 보세요. {causeTip[topCause!]}</p>
                </figure>
              )}
              {w.tag.length > 0 && (
                <div className="ev">
                  <p style={{ fontWeight: 800 }}>다시 볼 문항에 자주 나온 요소·소재</p>
                  <div className="ni-tags big">{w.tag.map(([t, c]) => <span key={t}>{t} <b>{c}</b></span>)}</div>
                </div>
              )}
              <p><Link className="btn ghost" href="/notes/print">시험 전 오답 요약 보기·인쇄</Link></p>
            </>
          )}
        </>
      ) : (
        <p className="faint"><Link href="/login?next=/notes">로그인</Link>하면 표시·틀린 이유·복습 일정·타이머 기록이 저장되고, 약점 분석과 비슷한 기출 추천이 열려요. 목록은 누구나 볼 수 있어요.</p>
      )}

      <h2 className="rh">우리 교재 오답 노트</h2>
      <div className="school-grid">
        {bookSources.map((b) => (
          <Link key={b.code} href={`/notes/${b.code}`} className={`sg ${by(b.code) ? "on" : ""}`}>
            <b>{b.title}</b>
            <span className="faint">{b.kind} · {by(b.code) ? `${by(b.code)} / ` : ""}{b.items.length}문항</span>
          </Link>
        ))}
        {plannedBooks.map((b) => (
          <div key={b.key} className="sg off">
            <b>{b.title}</b>
            <span className="faint">{b.kind} · 교재가 나오면 열려요</span>
          </div>
        ))}
      </div>
      <p className="faint">교재마다 문항 번호대로 노트가 만들어지고, 틀리면 그 문항의 다시 볼 것과 주의할 점이 바로 보여요.</p>

      {started.length > 0 && <h2 className="rh">내가 푼 학교</h2>}
      <div className="school-grid">
        {started.map((c) => (
          <Link key={c} href={`/notes/${c}`} className="sg on">
            <b>{shortName(c)}</b>
            <span className="faint">{by(c)} / {pastItems[c].length}문항{by(c, true) ? ` · 다시 ${by(c, true)}` : ""}</span>
            <span className="sg-bar"><i style={{ width: `${(by(c) / pastItems[c].length) * 100}%` }} /></span>
          </Link>
        ))}
      </div>
      <h2 className="rh">{started.length ? "다른 학교" : "학교 고르기"}</h2>
      <div className="school-grid">
        {rest.map((c) => (
          <Link key={c} href={`/notes/${c}`} className="sg">
            <b>{shortName(c)}</b>
            <span className="faint">{pastItems[c].length}문항</span>
          </Link>
        ))}
      </div>
      <p className="faint" style={{ marginTop: 32 }}>출처: 논술의 시대 기출 DB(각 대학 공개 기출·모의논술). 단원·풀이 형태·요소·난도 분류와 비슷한 기출 연결은 자체 분류예요. 복습 간격 1·3·6주는 논술의 시대 문제집 제작 지침을 따랐어요.</p>
    </div>
  );
}
