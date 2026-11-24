import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import NoteList from "./NoteList";
import { currentUser, userClient } from "@/lib/supabase/server";
import { pastItems, shortName } from "@/lib/notes";

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
  let notes: Record<string, { status: string; memo: string | null }> = {};
  if (user) {
    const sb = await userClient();
    const rows = ((await sb?.from("item_notes").select("item_id, status, memo").eq("school", school))?.data ?? []) as { item_id: string; status: string; memo: string | null }[];
    notes = Object.fromEntries(rows.map((r) => [r.item_id, { status: r.status, memo: r.memo }]));
  }
  return (
    <div className="wrap article" style={{ maxWidth: 900 }}>
      <div className="crumb"><Link href="/notes">기출 오답 노트</Link> /</div>
      <h1>{shortName(school)}</h1>
      <p className="muted">{items.length}문항 · 최근 학년도부터. 단원과 풀이 형태를 보고 약한 곳부터 골라 풀어도 돼요.</p>
      <NoteList school={school} items={items} initial={notes} loggedIn={!!user} />
    </div>
  );
}
