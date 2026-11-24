import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import NoteList from "./NoteList";
import { currentUser, userClient } from "@/lib/supabase/server";
import { formName, pastItems, schoolCoverage, shortName, type Note } from "@/lib/notes";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ school: string }> }): Promise<Metadata> {
  const { school } = await params;
  return pastItems[school] ? { title: `${shortName(school)} 기출 오답 노트`, robots: { index: false } } : {};
}

export default async function SchoolNotes({ params }: { params: Promise<{ school: string }> }) {
  const { school } = await params;
  const items = pastItems[school];
  if (!items) notFound();
  const user = await currentUser();
  let notes: Note[] = [];
  if (user) {
    const sb = await userClient();
    notes = ((await sb?.from("item_notes").select("item_id, school, status, memo, causes, time_sec, review_at, review_step, updated_at").eq("school", school))?.data ?? []) as Note[];
  }
  const cov = schoolCoverage(school, notes);
  const forms = [...items.reduce((m, it) => m.set(it.f, (m.get(it.f) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const topForm = forms[0];
  const recent = items.filter((it) => it.y >= Math.max(...items.map((x) => x.y)) - 2).length;
  return (
    <div className="wrap article" style={{ maxWidth: 900 }}>
      <div className="crumb"><Link href="/notes">기출 오답 노트</Link> /</div>
      <h1>{shortName(school)}</h1>
      <p className="muted">
        {items.length}문항, 최근 3개년 {recent}문항이에요. 가장 많은 풀이 형태는 {formName[topForm[0]] ?? topForm[0]}({Math.round((topForm[1] / items.length) * 100)}%)이에요.
        아래 그래프에서 많이 나오는 단원부터 채워 가면 이 학교 시험에 가까워져요.
      </p>
      <figure className="ev">
        <figcaption>{cov[0].k}{cov[1] ? `·${cov[1].k}` : ""} 문항이 가장 많아요{user ? `. 내가 푼 문항은 빨간 막대예요` : ""}</figcaption>
        <div className="hbars">
          {cov.map((c) => (
            <div className="hb" key={c.k}>
              <span className="hb-n" title={c.k}>{c.k}</span>
              <span className="hb-t"><i style={{ width: `${(c.n / cov[0].n) * 100}%` }} /><i className="hot over" style={{ width: `${(c.done / cov[0].n) * 100}%` }} /></span>
              <span className="hb-v">{user ? `${c.done}/` : ""}{c.n}<small> 문항</small></span>
            </div>
          ))}
        </div>
        <p className="ev-src">출처: 논술의 시대 기출 DB(2021~2027학년도, 단원은 자체 분류)</p>
      </figure>
      {!user && <p className="faint"><Link href={`/login?next=/notes/${school}`}>로그인</Link>하면 표시·메모·복습 일정·타이머 기록이 저장돼요.</p>}
      <NoteList school={school} items={items} initial={notes} loggedIn={!!user} />
    </div>
  );
}
