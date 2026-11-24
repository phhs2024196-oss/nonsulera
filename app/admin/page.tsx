import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser, serviceClient } from "@/lib/supabase/server";
import { books, materials } from "@/lib/site";
import { types } from "@/lib/test";

export const metadata: Metadata = { title: "운영 현황", robots: { index: false } };
export const dynamic = "force-dynamic";

const nameOf = (k: string) => {
  const b = books.find((x) => x.key === k);
  if (b) return `${b.title}(${b.kind})`;
  const m = materials.find((x) => x.slug === k);
  if (m) return `${m.title}(${m.kind})`;
  return k === "grading" ? "답안 첨삭" : k;
};

function count<T>(rows: T[], pick: (r: T) => string[] | string | null) {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const v = pick(r);
    (Array.isArray(v) ? v : v ? [v] : []).forEach((x) => m.set(x, (m.get(x) ?? 0) + 1));
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="tablebox">
      <table className="stat">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={head.length} className="faint">아직 기록이 없어요</td></tr>}
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={typeof c === "number" ? "num" : ""}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default async function Admin() {
  const user = await currentUser();
  const sb = serviceClient();
  if (!user || !sb) notFound();
  const me = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me.data?.is_admin) notFound();

  const [dl, daily, wishes, pages, refs, profiles, tp] = await Promise.all([
    sb.from("stat_downloads").select("*"),
    sb.from("stat_daily").select("*").limit(14),
    sb.from("stat_wishes").select("*"),
    sb.from("stat_pages").select("*").limit(15),
    sb.from("stat_referrers").select("*").limit(10),
    sb.from("profiles").select("grade,target_schools,strengths,wanted_books,marketing_ok"),
    sb.from("stat_types").select("*"),
  ]);
  const P = profiles.data ?? [];

  return (
    <div className="wrap" style={{ padding: "48px var(--gutter)" }}>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>운영 현황</h1>
      <p className="muted" style={{ marginBottom: 32 }}>회원 {P.length}명 · 소식 수신 동의 {P.filter((p) => p.marketing_ok).length}명</p>

      <h2 style={{ fontSize: 20, marginBottom: 10 }}>자료 다운로드</h2>
      <Table head={["자료", "총 횟수", "받은 사람", "최근 7일"]} rows={(dl.data ?? []).map((r) => [nameOf(r.target), r.total, r.unique_people, r.last_7d])} />

      <h2 style={{ fontSize: 20, marginBottom: 10 }}>논술 유형 검사 결과</h2>
      <Table head={["유형", "검사 횟수", "사람 수"]} rows={(tp.data ?? []).map((r) => [`${types[r.code]?.name ?? ""}(${r.code})`, r.results, r.people])} />

      <h2 style={{ fontSize: 20, marginBottom: 10 }}>최근 14일</h2>
      <Table head={["날짜", "방문자", "페이지뷰", "다운로드", "가입"]} rows={(daily.data ?? []).map((r) => [r.day, r.visitors, r.views, r.downloads, r.signups])} />

      <h2 style={{ fontSize: 20, marginBottom: 10 }}>기다리는 책·서비스 (비회원 포함)</h2>
      <Table head={["항목", "표시한 사람"]} rows={(wishes.data ?? []).map((r) => [nameOf(r.target), r.people])} />

      <h2 style={{ fontSize: 20, marginBottom: 10 }}>회원 정보 분포</h2>
      <Table head={["학년", "명"]} rows={count(P, (p) => p.grade)} />
      <Table head={["목표 학교", "명"]} rows={count(P, (p) => p.target_schools).slice(0, 20)} />
      <Table head={["자신 있는 과목", "명"]} rows={count(P, (p) => p.strengths)} />
      <Table head={["먼저 받고 싶은 책", "명"]} rows={count(P, (p) => p.wanted_books).map(([k, n]) => [nameOf(k), n])} />

      <h2 style={{ fontSize: 20, marginBottom: 10 }}>많이 본 페이지 (30일)</h2>
      <Table head={["주소", "조회", "방문자"]} rows={(pages.data ?? []).map((r) => [r.path, r.views, r.visitors])} />

      <h2 style={{ fontSize: 20, marginBottom: 10 }}>어디서 왔나 (30일)</h2>
      <Table head={["유입", "방문자"]} rows={(refs.data ?? []).map((r) => [r.source, r.visitors])} />
      <p className="faint">원자료는 Supabase의 events 표에서 CSV로 내려받을 수 있어요.</p>
    </div>
  );
}
