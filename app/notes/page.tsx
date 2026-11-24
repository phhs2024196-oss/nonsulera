import Link from "next/link";
import type { Metadata } from "next";
import { currentUser, userClient } from "@/lib/supabase/server";
import { pastItems, pastSchools, shortName } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "기출 오답 노트",
  description: "44개 대학 수리논술 기출 2,240문항(2021~2027학년도) 목록에 풀었음·틀림·다시 풀기와 메모를 남기는 오답 노트.",
};

export default async function Notes() {
  const user = await currentUser();
  let mine: { school: string; status: string }[] = [];
  if (user) {
    const sb = await userClient();
    mine = ((await sb?.from("item_notes").select("school, status"))?.data ?? []) as typeof mine;
  }
  const by = (code: string, st?: string) => mine.filter((m) => m.school === code && (!st || m.status === st)).length;
  const total = pastSchools.reduce((a, c) => a + pastItems[c].length, 0);
  const started = pastSchools.filter((c) => by(c) > 0);
  const rest = pastSchools.filter((c) => by(c) === 0);
  const wrong = mine.filter((m) => m.status !== "solved").length;

  return (
    <div className="wrap article" style={{ maxWidth: 900 }}>
      <h1>기출 오답 노트</h1>
      <p className="muted">
        {pastSchools.length}개 대학, 2021~2027학년도 수리논술 {total.toLocaleString("ko-KR")}문항의 목록이에요. 문항마다 단원과 풀이 형태, 배점을 붙여 뒀어요.
        푼 문항에 표시하고 틀린 이유를 한 줄 적어 두면, 시험 2주 전에 그 줄만 다시 보면 돼요.
      </p>
      {user ? (
        <p className="note-sum"><b>{mine.length}</b>문항 표시 · 다시 볼 문항 <b className="hot">{wrong}</b>개</p>
      ) : (
        <p className="faint"><Link href="/login?next=/notes">로그인</Link>하면 표시와 메모가 저장돼요. 목록은 누구나 볼 수 있어요.</p>
      )}
      <p className="faint">문제지는 각 대학 입학처의 논술 기출 자료실에서 받아 풀어요. 여기에는 문항 목록과 분류만 있어요.</p>

      {started.length > 0 && <h2 className="rh">내가 푼 학교</h2>}
      <div className="school-grid">
        {started.map((c) => (
          <Link key={c} href={`/notes/${c}`} className="sg on">
            <b>{shortName(c)}</b>
            <span className="faint">{by(c)} / {pastItems[c].length}문항{by(c, "wrong") + by(c, "retry") ? ` · 다시 ${by(c, "wrong") + by(c, "retry")}` : ""}</span>
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
      <p className="faint" style={{ marginTop: 32 }}>출처: 논술의 시대 기출 DB(각 대학 공개 기출·모의논술, 단원·풀이 형태 분류는 자체 분류).</p>
    </div>
  );
}
