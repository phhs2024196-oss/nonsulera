"use client";
import { useState } from "react";
import ItemCard from "./ItemCard";
import { itemIndex, itemTitle, kstToday, recommend, type Note } from "@/lib/notes";

/** 오늘 복습할 문항 + 틀린 문항과 비슷한 기출 추천 (상태가 바뀌면 바로 다시 계산) */
export default function Hub({ initial }: { initial: Note[] }) {
  const [notes, setNotes] = useState(initial);
  const today = kstToday();
  const due = notes.filter((n) => n.review_at && n.review_at <= today && itemIndex[n.item_id]);
  const recs = recommend(notes, 6);
  const set = (id: string) => (n: Note | null) => setNotes((cur) => (n ? [...cur.filter((x) => x.item_id !== id), n] : cur.filter((x) => x.item_id !== id)));
  return (
    <>
      <h2 className="rh">오늘 복습 {due.length ? <b className="hot">{due.length}</b> : null}</h2>
      {due.length ? (
        <>
          <p className="faint">틀린 문항은 1주, 3주, 6주 뒤에 다시 나와요. 세 번 연속 맞히면 노트에서 졸업해요.</p>
          <div className="nitems">{due.map((n) => <ItemCard key={n.item_id} item={itemIndex[n.item_id]} school={n.school} note={n} loggedIn onSaved={set(n.item_id)} showSchool />)}</div>
        </>
      ) : <p className="muted">오늘 다시 풀 문항은 없어요. 틀림이나 다시 풀기로 표시한 문항은 1주 뒤에 여기로 돌아와요.</p>}

      {recs.length > 0 && (
        <>
          <h2 className="rh">틀린 문항과 비슷한 기출</h2>
          <p className="faint">핵심 아이디어나 소재가 같은 다른 학교 문항 중 아직 안 푼 것만 골랐어요.</p>
          <div className="nitems">
            {recs.map((r) => {
              const it = itemIndex[r.id];
              return <ItemCard key={r.id} item={it} school={it.s} note={notes.find((n) => n.item_id === r.id)} loggedIn onSaved={set(r.id)} showSchool
                reason={`틀린 ${itemTitle(r.from)}과 비슷해요`} />;
            })}
          </div>
        </>
      )}
    </>
  );
}
