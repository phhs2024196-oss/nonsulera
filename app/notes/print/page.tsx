import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import PrintButton from "./PrintButton";
import { currentUser, userClient } from "@/lib/supabase/server";
import { formName, itemIndex, itemTitle, shortName, type Note } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "오답 요약", robots: { index: false } };

/** 시험 전에 한 번에 훑어보는 오답 요약(학교별, 틀린 이유·메모·비슷한 기출) */
export default async function Print({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/notes/print");
  const { s } = await searchParams;
  const sb = await userClient();
  const all = ((await sb?.from("item_notes").select("item_id, school, status, memo, causes, time_sec, review_at, review_step"))?.data ?? []) as Note[];
  const bad = all.filter((n) => (n.status !== "solved" || n.review_step > 0) && itemIndex[n.item_id] && (!s || n.school === s));
  const schoolsIn = [...new Set(all.filter((n) => n.status !== "solved").map((n) => n.school))];
  const groups = [...bad.reduce((m, n) => m.set(n.school, [...(m.get(n.school) ?? []), n]), new Map<string, Note[]>())];
  return (
    <div className="wrap article printable" style={{ maxWidth: 820 }}>
      <div className="noprint crumb"><Link href="/notes">기출 오답 노트</Link> /</div>
      <h1>오답 요약</h1>
      <p className="muted">{bad.length}문항 · 시험 2주 전부터 하루 한 학교씩 이 종이만 훑어보세요. 메모의 첫 줄이 다음 시험에서 떠올려야 할 출발점이에요.</p>
      <div className="noprint" style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0 20px" }}>
        <Link className={`btn ${s ? "ghost" : ""}`} href="/notes/print">전체</Link>
        {schoolsIn.map((c) => <Link key={c} className={`btn ${s === c ? "" : "ghost"}`} href={`/notes/print?s=${c}`}>{shortName(c)}</Link>)}
        <PrintButton />
      </div>
      {groups.length === 0 && <p className="muted">요약할 오답이 없어요.</p>}
      {groups.map(([school, list]) => (
        <section key={school} className="psec">
          <h2 className="rh">{shortName(school)} <span className="faint">{list.length}문항</span></h2>
          <ol className="plist">
            {list.map((n) => {
              const it = itemIndex[n.item_id];
              return (
                <li key={n.item_id}>
                  <b>{itemTitle(n.item_id)}</b> <span className="faint">{it.u} · {formName[it.f] ?? it.f}{it.p ? ` · ${it.p}점` : ""}</span>
                  {it.tg.length > 0 && <div className="faint">요소·소재: {it.tg.slice(0, 4).join(", ")}</div>}
                  {((n.causes?.length ?? 0) > 0 || n.memo) && <div className="pmemo">{(n.causes ?? []).join(" · ")}{n.causes?.length && n.memo ? " / " : ""}{n.memo}</div>}
                  {it.sim.length > 0 && <div className="faint">같이 볼 기출: {it.sim.map(itemTitle).join(", ")}</div>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
