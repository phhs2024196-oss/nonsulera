import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ProfileForm from "./ProfileForm";
import { currentUser, userClient } from "@/lib/supabase/server";
import { books, grades, materials, strengths } from "@/lib/site";
import { poleInfo, types, type Pole } from "@/lib/test";
import { schools, judge, generalRule, type Scores } from "@/lib/diag";
import { shortName } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "내 기록", robots: { index: false } };

const day = (s: string) => new Date(s).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });

export default async function Me() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/me");
  const sb = await userClient();
  const { data } = (await sb?.from("profiles").select("*").eq("id", user.id).single()) ?? { data: null };
  const { data: act } = (await sb?.rpc("my_activity")) ?? { data: null };
  const initial = {
    nickname: data?.nickname ?? "", grade: data?.grade ?? "",
    target_schools: data?.target_schools ?? [], strengths: data?.strengths ?? [],
    wanted_books: data?.wanted_books ?? [], marketing_ok: data?.marketing_ok ?? false,
  };
  const code: string | null = data?.nonsul_type ?? null;
  const t = code ? types[code] : null;
  const order = code ? ([code[1], code[0], code[2], code[3]] as Pole[]).map((p) => poleInfo[p].book) : [];
  const diag = (data?.diag ?? null) as Scores | null;
  const saved = ((data?.saved_schools ?? []) as string[]).map((c) => schools.find((s) => s.code === c)).filter((s) => !!s);
  const dls = (act?.downloads ?? []) as { target: string; n: number; last: string }[];
  const memberOnly = materials.filter((m) => m.membersOnly);
  const savedCodes = saved.map((x) => x!.code);
  const notices = savedCodes.length
    ? (((await sb?.from("school_notices").select("id, school, title, body, url, created_at").in("school", savedCodes).order("created_at", { ascending: false }).limit(20))?.data ?? []) as { id: number; school: string; title: string; body: string | null; url: string | null; created_at: string }[])
    : [];
  const notes = (((await sb?.from("item_notes").select("school, status, item_id, memo, updated_at").order("updated_at", { ascending: false }))?.data ?? []) as { school: string; status: string; item_id: string; memo: string | null; updated_at: string }[]);
  const again = notes.filter((x) => x.status !== "solved");
  const reps = (((await sb?.from("weak_reports").select("id, level, seen").order("level", { ascending: false }).limit(1))?.data ?? []) as { id: number; level: number; seen: boolean }[]);
  const qs = (((await sb?.from("questions").select("id, status").eq("user_id", user.id))?.data ?? []) as { id: number; status: string }[]);

  return (
    <div className="wrap article" style={{ maxWidth: 820 }}>
      <h1>{initial.nickname ? `${initial.nickname}님의 기록` : "내 기록"}</h1>

      <section className="me-sec">
        <h2 className="rh">내 논술 유형</h2>
        {t && code ? (
          <>
            <p><Link href={`/test/result/${code}`}><b className="me-type">{t.name}</b> <span className="faint">{code}</span></Link></p>
            <p className="muted">{t.line}</p>
            <p className="faint" style={{ marginBottom: 6 }}>이 유형의 준비 순서</p>
            <ol>{order.map((b) => <li key={b.title}><b>{b.title}</b> ({b.kind})</li>)}</ol>
          </>
        ) : (
          <p className="muted">아직 검사 전이에요. <Link href="/test">3분 유형 검사</Link>를 하면 여기에 결과와 준비 순서가 저장돼요.</p>
        )}
      </section>

      <section className="me-sec">
        <h2 className="rh">내 대학 진단</h2>
        {diag ? (
          <p className="muted">수능 예상 국어 {diag.kor ?? "-"} · 수학 {diag.math ?? "-"} · 영어 {diag.eng ?? "-"} · 탐구 {diag.tam ?? "-"}등급 기준 ·{" "}
            <Link href="/diagnosis">다시 진단하기</Link></p>
        ) : (
          <p className="muted">아직 진단 전이에요. <Link href="/diagnosis">내 대학 진단</Link>에서 수능 예상 등급을 넣어 보세요.</p>
        )}
        {saved.length > 0 && (
          <div className="rows" style={{ marginTop: 12 }}>
            {saved.map((s) => {
              const g = generalRule(s!); const j = diag && g ? judge(g.rule, diag) : null;
              return (
                <div className="row" key={s!.code}>
                  <div><b>{s!.short}</b> <span className="k">{s!.dates2027[0] ? `2027 시험 ${s!.dates2027.join(", ")}` : ""}</span>
                    <p className="d">수능최저: {g?.rule || "없음"}</p></div>
                  {j && <span className={`tag st-${j.status}`}>{({ none: "최저 없음", ok: "충족 예상", short: "부족", check: "직접 확인", unknown: "등급 입력 필요" })[j.status]}</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="me-sec">
        <h2 className="rh">내 대학 소식</h2>
        {savedCodes.length === 0 ? (
          <p className="muted"><Link href="/diagnosis">내 대학 진단</Link>에서 학교에 ☆를 누르면, 그 학교의 모집요강·시험 일정 소식이 여기에 모여요.</p>
        ) : notices.length ? (
          <div className="rows">
            {notices.map((x) => (
              <div className="row" key={x.id}>
                <div><b>{schools.find((s) => s.code === x.school)?.short ?? x.school}</b> <span className="k">{day(x.created_at)}</span>
                  <p className="d">{x.title}{x.body ? ` · ${x.body}` : ""}</p></div>
                {x.url && <a className="btn ghost" href={x.url} target="_blank" rel="noopener">원문</a>}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">찜한 {savedCodes.length}곳의 새 소식은 아직 없어요. 2028학년도 모집요강은 대학마다 2027년 5월 말쯤 나오고, 나오는 대로 여기에 올려요.</p>
        )}
      </section>

      <section className="me-sec">
        <h2 className="rh">기출 오답 노트</h2>
        {notes.length ? (
          <>
            <p className="muted">{notes.length}문항 표시 · 다시 볼 문항 <b>{again.length}</b>개 · <Link href="/notes">노트 열기</Link></p>
            {reps[0] && <Link className="report-banner" href={`/notes/report/${reps[0].id}`}>{reps[0].seen ? "약점 리포트 다시 보기" : <b>새 약점 리포트가 나왔어요</b>} · 다시 볼 문항 {reps[0].level}개 기준</Link>}
            {again.length > 0 && (
              <ul>{again.slice(0, 5).map((x) => (
                <li key={x.item_id}><Link href={`/notes/${x.school}`}>{shortName(x.school)} {x.item_id.split("-").slice(1).join("-")}</Link>{x.memo ? ` · ${x.memo}` : ""}</li>
              ))}</ul>
            )}
          </>
        ) : <p className="muted">아직 표시한 문항이 없어요. <Link href="/notes">기출 오답 노트</Link>에서 학교를 골라 푼 문항에 표시해 보세요.</p>}
      </section>

      <section className="me-sec">
        <h2 className="rh">내 질문</h2>
        <p className="muted">{qs.length ? `${qs.length}개 질문 · 답변 완료 ${qs.filter((q) => q.status === "answered").length}개 · ` : "아직 보낸 질문이 없어요. "}<Link href="/qna/ask">{qs.length ? "질문 보기" : "질문하기"}</Link></p>
      </section>

      <section className="me-sec">
        <h2 className="rh">회원 전용 자료</h2>
        <div className="rows">
          {memberOnly.map((m) => (
            <div className="row" key={m.slug}>
              <div><b>{m.title}</b> <span className="k">({m.kind})</span><p className="d">{m.summary}</p></div>
              {m.file ? <a className="btn" href={`/download/${m.slug}?from=me`}>받기</a> : <span className="tag">준비 중</span>}
            </div>
          ))}
        </div>
        {memberOnly.some((m) => !m.file) && <p className="faint" style={{ marginTop: 8 }}>나오면 이 페이지에서 바로 받을 수 있어요. 소식 받기에 동의하면 메일로도 알려 드려요.</p>}
      </section>

      <section className="me-sec">
        <h2 className="rh">받은 자료</h2>
        {dls.length ? (
          <ul>{dls.map((d) => {
            const m = materials.find((x) => x.slug === d.target);
            return <li key={d.target}>{m ? `${m.title}(${m.kind})` : d.target} · {day(d.last)}{d.n > 1 ? ` (${d.n}번)` : ""}</li>;
          })}</ul>
        ) : <p className="muted">로그인한 뒤 받은 자료가 여기에 모여요. <Link href="/materials">무료 자료 보기</Link></p>}
      </section>

      <section className="me-sec">
        <h2 className="rh">내 정보</h2>
        <p className="muted">알려 주시면 필요한 책부터 만들고, 맞는 학교편을 먼저 보내 드릴게요. 모두 선택이에요.</p>
        <ProfileForm initial={initial} grades={grades} strengths={strengths} books={books} />
      </section>
    </div>
  );
}
