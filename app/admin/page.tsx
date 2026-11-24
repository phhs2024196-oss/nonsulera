import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { userClient } from "@/lib/supabase/server";
import { books, materials } from "@/lib/site";
import { types } from "@/lib/test";
import { schoolName } from "@/lib/diag";

export const metadata: Metadata = { title: "관리자", robots: { index: false } };
export const dynamic = "force-dynamic";

// 규칙: 본 사이트에 기능을 추가하면 그 기능의 통계·목록·설정 구획을 이 페이지에도 함께 추가한다. (README '개발 규칙')

type R = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const nameOf = (k: string) => {
  const b = books.find((x) => x.key === k);
  if (b) return `${b.title}(${b.kind})`;
  const m = materials.find((x) => x.slug === k);
  if (m) return `${m.title}(${m.kind})`;
  return k === "grading" ? "답안 첨삭" : k;
};
const n = (v: unknown) => Number(v ?? 0).toLocaleString("ko-KR");
const kst = (s: string) => new Date(s).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
const provider: Record<string, string> = { kakao: "카카오", google: "구글", email: "이메일" };

function count<T>(rows: T[], pick: (r: T) => string[] | string | null) {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const v = pick(r);
    (Array.isArray(v) ? v : v ? [v] : []).forEach((x) => m.set(x, (m.get(x) ?? 0) + 1));
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Table({ head, rows, bar }: { head: string[]; rows: (string | number)[][]; bar?: number }) {
  const max = bar !== undefined ? Math.max(1, ...rows.map((r) => Number(r[bar]) || 0)) : 0;
  return (
    <div className="tablebox">
      <table className="stat">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={head.length} className="faint">아직 기록이 없어요</td></tr>}
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={typeof c === "number" ? "num" : ""}>
                  {bar === j ? <span className="abar"><i style={{ width: `${Math.max(2, (Number(c) / max) * 80)}px` }} />{n(c)}</span> : typeof c === "number" ? n(c) : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: unknown; sub?: string }) {
  return <div className="kpi"><div className="kl">{label}</div><div className="kv">{n(value)}</div>{sub && <div className="ks">{sub}</div>}</div>;
}

function Box({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return <section className={`abox${wide ? " wide" : ""}`}><h2>{title}</h2>{children}</section>;
}

export default async function Admin() {
  const sb = await userClient();
  if (!sb) notFound();
  const { data: st, error } = await sb.rpc("admin_stats");
  if (error || !st) notFound(); // 관리자 아니면 DB 함수가 거부
  const k = st.kpi as R;
  const P = st.profiles as R[];
  const daily = [...(st.daily as R[])].reverse();
  const dmax = Math.max(1, ...daily.map((d) => d.visitors));

  return (
    <div className="wrap admin" style={{ padding: "40px var(--gutter)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <h1 style={{ fontSize: 28 }}>관리자</h1>
        <span className="faint">불러온 시각 {kst(new Date().toISOString())} · 기록 시작 {k.first_event ? kst(k.first_event) : "-"}</span>
      </div>

      <div className="kpis">
        <Kpi label="오늘 방문자" value={k.visitors_today} sub={`7일 ${n(k.visitors_7d)} · 30일 ${n(k.visitors_30d)}`} />
        <Kpi label="누적 방문자" value={k.visitors_all} sub={`페이지뷰 ${n(k.views_all)}`} />
        <Kpi label="자료 다운로드" value={k.downloads_all} sub={`최근 7일 ${n(k.downloads_7d)}`} />
        <Kpi label="회원" value={k.members} sub={`최근 7일 +${n(k.members_7d)} · 소식 동의 ${P.filter((p) => p.marketing_ok).length}`} />
        <Kpi label="유형 검사" value={k.tests_all} />
        <Kpi label="대학 진단" value={k.diagnoses_all} sub="기능 공개 전" />
      </div>

      <Box title="최근 30일 방문 추이" wide>
        <div className="spark" role="img" aria-label="일별 방문자 막대">
          {daily.map((d) => (
            <div key={d.day} className="sp" title={`${d.day} 방문자 ${d.visitors} · 다운로드 ${d.downloads} · 가입 ${d.signups}`}>
              <i style={{ height: `${(d.visitors / dmax) * 100}%` }} />
              {d.downloads > 0 && <b />}
            </div>
          ))}
        </div>
        <p className="faint">막대 = 방문자, 붉은 점 = 다운로드가 있던 날. 막대에 마우스를 올리면 숫자가 보여요.</p>
        <Table head={["날짜", "방문자", "페이지뷰", "다운로드", "가입"]} rows={(st.daily as R[]).slice(0, 14).map((r) => [r.day, r.visitors, r.views, r.downloads, r.signups])} />
      </Box>

      <div className="agrid">
        <Box title="자료 다운로드">
          <Table head={["자료", "총", "사람", "7일"]} rows={(st.downloads as R[]).map((r) => [nameOf(r.target), r.total, r.unique_people, r.last_7d])} />
          <Table head={["다운로드 유입(utm)", "횟수"]} rows={(st.utm as R[]).map((r) => [r.source, r.n])} bar={1} />
        </Box>
        <Box title="어디서 왔나 (30일)">
          <Table head={["유입", "방문자"]} rows={(st.referrers as R[]).map((r) => [r.source, r.visitors])} bar={1} />
        </Box>
        <Box title="많이 본 페이지 (30일)">
          <Table head={["주소", "조회", "방문자"]} rows={(st.pages as R[]).map((r) => [r.path, r.views, r.visitors])} bar={1} />
        </Box>
        <Box title="논술 유형 검사 분포">
          <Table head={["유형", "검사", "사람"]} rows={(st.types as R[]).map((r) => [`${r.code} ${types[r.code]?.name ?? ""}`, r.results, r.people])} bar={2} />
        </Box>
        <Box title="기다리는 책·서비스">
          <Table head={["항목", "표시한 사람"]} rows={(st.wishes as R[]).map((r) => [nameOf(r.target), r.people])} bar={1} />
        </Box>
        <Box title="찜 많이 된 대학 (대학 진단)">
          <Table head={["대학", "회원 수"]} rows={(st.saved_schools as R[]).map((r) => [schoolName(r.code), r.n])} bar={1} />
        </Box>
      </div>

      <Box title={`회원 목록 (최근 ${Math.min(50, (st.members_list as R[]).length)}명)`} wide>
        <Table head={["가입", "이름", "경로", "학년", "유형", "찜 대학", "소식 동의"]}
          rows={(st.members_list as R[]).map((m) => [kst(m.created_at), m.nickname ?? "", provider[m.provider] ?? m.provider ?? "", m.grade ?? "", m.nonsul_type ?? "", m.saved, m.marketing_ok ? "예" : ""])} />
      </Box>

      <div className="agrid">
        <Box title="학년"><Table head={["학년", "명"]} rows={count(P, (p) => p.grade)} bar={1} /></Box>
        <Box title="목표 학교 (직접 입력)"><Table head={["학교", "명"]} rows={count(P, (p) => p.target_schools).slice(0, 20)} bar={1} /></Box>
        <Box title="자신 있는 과목"><Table head={["과목", "명"]} rows={count(P, (p) => p.strengths)} bar={1} /></Box>
        <Box title="먼저 받고 싶은 책"><Table head={["책", "명"]} rows={count(P, (p) => p.wanted_books).map(([x, c]) => [nameOf(x), c])} bar={1} /></Box>
      </div>

      <p className="faint" style={{ marginTop: 24 }}>
        원자료는 Supabase 대시보드의 events 표(행동 기록)와 profiles 표(회원)에서 CSV로 내려받을 수 있어요. 공개 전 테스트 기록 약 20건이 포함돼 있어요.
      </p>
    </div>
  );
}
