import type { Metadata } from "next";
import Diag from "./Diag";
import { schools, diagYear } from "@/lib/diag";
import { currentUser, userClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "내 대학 진단",
  description: `수능 예상 등급과 내신 상황을 넣으면 ${diagYear}학년도 수리논술 대학 ${schools.length}곳의 수능최저 충족 여부, 학생부 반영, 시험 형식을 한 번에 보여 줘요.`,
};

export default async function Page() {
  const user = await currentUser();
  let initial: { diag: Record<string, unknown> | null; saved: string[] } | null = null;
  if (user) {
    const sb = await userClient();
    const { data } = (await sb?.from("profiles").select("diag, saved_schools").eq("id", user.id).single()) ?? { data: null };
    initial = { diag: data?.diag ?? null, saved: data?.saved_schools ?? [] };
  }
  return (
    <div className="wrap" style={{ padding: "clamp(36px,6vw,72px) var(--gutter)" }}>
      <h1 style={{ fontSize: "clamp(28px,4vw,40px)" }}>내 대학 진단</h1>
      <p className="muted" style={{ maxWidth: "40em", marginTop: 12 }}>
        수능 예상 등급을 넣으면 {diagYear}학년도 논술 전형이 있는 {schools.length}개 대학의 수능최저 충족 여부를 계산해요.
        학생부를 얼마나 보는지, 시험이 몇 분·몇 문항인지도 함께 보여 드려요.
      </p>
      <Diag schools={schools} loggedIn={!!user} initial={initial} />
      <p className="faint" style={{ marginTop: 40, maxWidth: "48em" }}>
        기준: 각 대학 {diagYear}학년도 대학입학전형시행계획(일반 모집단위). 시험 시간·문항과 날짜는 2027학년도 모집요강, 경쟁률은 2026학년도 자연계 논술 입시결과예요.
        탐구는 상위 1과목으로 계산해서, '2과목 평균'이나 '수학 포함' 같은 조건이 붙은 대학은 '직접 확인'으로 표시해요.
        참고용 추정이니 지원 전에는 반드시 대학 모집요강을 확인하세요.
      </p>
    </div>
  );
}
