import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Bars from "../../Bars";
import { currentUser, userClient } from "@/lib/supabase/server";
import type { Report } from "@/lib/report";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "약점 리포트", robots: { index: false } };
const day = (s: string) => new Date(s).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=/notes/report/${id}`);
  const sb = await userClient();
  const { data } = (await sb?.from("weak_reports").select("id, level, report, created_at, seen").eq("id", Number(id)).maybeSingle()) ?? { data: null };
  if (!data) notFound();
  if (!data.seen) await sb?.rpc("mark_report_seen", { p_id: data.id });
  const r = data.report as Report;
  const { data: list } = (await sb?.from("weak_reports").select("id, level, created_at").order("created_at", { ascending: false })) ?? { data: [] };
  return (
    <div className="wrap article" style={{ maxWidth: 820 }}>
      <div className="crumb"><Link href="/notes">기출 오답 노트</Link> /</div>
      <h1>약점 리포트</h1>
      <p className="muted">{day(data.created_at)} · 표시한 {r.total}문항 중 다시 볼 문항 {r.bad}개({data.level}개 도달)로 만든 리포트예요.</p>

      <div className="report-focus">
        {r.focus.map((f, i) => <p key={i}>{f}</p>)}
      </div>

      {r.unit.some((u) => u.bad > 0) && (
        <figure className="ev">
          <figcaption>{r.unit[0].k}이(가) 가장 약해요</figcaption>
          <Bars rows={r.unit.filter((u) => u.bad > 0).map((u) => ({ k: u.k, v: u.bad, sub: `/${u.n} · ${u.pct}%` }))} unit="문항" />
          <p className="ev-note">단원별로 다시 볼 문항 수예요. 오른쪽 숫자는 그 단원에서 표시한 문항 수와 비율이에요.</p>
        </figure>
      )}
      {r.form.some((f) => f.bad > 0) && (
        <figure className="ev">
          <figcaption>풀이 형태로는 {r.form[0].k} 문항에서 많이 막혀요</figcaption>
          <Bars rows={r.form.filter((f) => f.bad > 0).map((f) => ({ k: f.k, v: f.bad, sub: `/${f.n}` }))} unit="문항" />
        </figure>
      )}
      {r.concepts.length > 0 && (
        <>
          <h2 className="rh">다시 볼 개념</h2>
          <p className="faint">틀린 문항의 코멘트에 자주 나온 개념이에요. 위에서부터 교과서 정의와 정리를 다시 읽어요.</p>
          <ol>{r.concepts.map(([k, v]) => <li key={k}>{k} <span className="faint">({v}문항)</span></li>)}</ol>
        </>
      )}
      {r.cause.length > 0 && (
        <>
          <h2 className="rh">틀린 이유별 처방</h2>
          <div className="rows">{r.cause.map((c) => <div className="row" key={c.k}><div><b>{c.k}</b> <span className="k">{c.v}번</span><p className="d">{c.tip}</p></div></div>)}</div>
        </>
      )}
      {r.tag.length > 0 && (
        <>
          <h2 className="rh">자주 걸린 요소·소재</h2>
          <div className="ni-tags big">{r.tag.map(([t, c]) => <span key={t}>{t} <b>{c}</b></span>)}</div>
        </>
      )}
      <h2 className="rh">이번 주에 할 일</h2>
      <ol>{r.plan.map((p, i) => <li key={i}>{p}</li>)}</ol>
      {r.recs.length > 0 && (
        <ul>{r.recs.map((x) => <li key={x.id}><Link href={`/notes/${x.school}#${x.id}`}>{x.title}</Link> <span className="faint">· {x.from}과 비슷</span></li>)}</ul>
      )}
      {(list?.length ?? 0) > 1 && (
        <>
          <h2 className="rh">지난 리포트</h2>
          <ul>{list!.filter((x) => x.id !== data.id).map((x) => <li key={x.id}><Link href={`/notes/report/${x.id}`}>{day(x.created_at)} · 다시 볼 문항 {x.level}개</Link></li>)}</ul>
        </>
      )}
      <p className="faint" style={{ marginTop: 32 }}>리포트는 다시 볼 문항이 10개, 20개, 30개가 될 때마다 새로 만들어져요. 그때까지 쌓인 표시와 틀린 이유로 계산했어요.</p>
    </div>
  );
}
