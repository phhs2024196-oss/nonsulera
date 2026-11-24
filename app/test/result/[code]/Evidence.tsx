import ev from "@/lib/data/test-evidence.json";
import type { Pole } from "@/lib/test";

type Row = { school: string; value: number; n?: number; minutes?: number };
const srcProfile = "출처: 논술의 시대 기출 DB(학교별 최근 3개년 수리논술 문항 분류)";
const srcExam = "출처: 각 대학 2027학년도 모집요강의 시험 시간·문항 수";

function Hbars({ rows, unit, label }: { rows: Row[]; unit: string; label?: (r: Row) => string }) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div className="hbars">
      {rows.map((r, i) => (
        <div className="hb" key={r.school}>
          <span className="hb-n">{r.school}</span>
          <span className="hb-t"><i className={i < 2 ? "hot" : ""} style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="hb-v">{r.value}{unit}{label ? <small> {label(r)}</small> : null}</span>
        </div>
      ))}
    </div>
  );
}

function names(rows: Row[], k: number) {
  return rows.slice(0, k).map((r) => r.school).join("·");
}

export default function Evidence({ pole }: { pole: Pole }) {
  if (pole === "A") {
    const a = ev.A;
    return (
      <figure className="ev">
        <figcaption>2028학년도 논술전형 {a.of}곳 중 {a.count}곳은 학생부를 보지 않아요</figcaption>
        <div className="stack" role="img" aria-label={`${a.of}곳 중 ${a.count}곳`}>
          <i className="hot" style={{ width: `${(a.count / a.of) * 100}%` }}>{a.count}곳</i>
          <i style={{ width: `${((a.of - a.count) / a.of) * 100}%` }}>{a.of - a.count}곳 반영</i>
        </div>
        <p className="ev-list">{a.schools.join(", ")}</p>
        <p className="ev-src">출처: 각 대학 2028학년도 대입전형 시행계획(전형 요소 반영 비율). 새로 논술을 여는 대전대는 원본을 못 구해 빠졌어요.</p>
      </figure>
    );
  }
  if (pole === "H") {
    const rows = ev.H.rows;
    const third = rows.filter((r) => r.x <= 0.41).length;
    const max = Math.max(...rows.map((r) => r.rate));
    return (
      <figure className="ev">
        <figcaption>공개한 {rows.length}곳 중 {third}곳은 최저를 맞춘 사람끼리 겨루면 경쟁률이 3분의 1 안팎이에요</figcaption>
        <div className="dumb">
          {rows.map((r) => (
            <div className="db" key={r.school}>
              <span className="hb-n">{r.school}</span>
              <span className="db-t">
                <i className="line" style={{ left: `${(r.real / max) * 100}%`, width: `${((r.rate - r.real) / max) * 100}%` }} />
                <i className="dot hot" style={{ left: `${(r.real / max) * 100}%` }} />
                <i className="dot" style={{ left: `${(r.rate / max) * 100}%` }} />
              </span>
              <span className="hb-v">{r.rate} → <b>{r.real}</b></span>
            </div>
          ))}
        </div>
        <p className="ev-note">회색 점은 겉보기 경쟁률, 빨간 점은 실질경쟁률(최저를 맞춘 사람끼리의 경쟁률)이에요. 인하대·서울여대처럼 거의 줄지 않는 곳도 있어요.</p>
        <p className="ev-src">출처: 각 대학 2026학년도 입시결과(논술 자연계열, 실질경쟁률을 공개한 학교만)</p>
      </figure>
    );
  }
  const e = ev[pole] as { title: string; unit: string; metric: string; rows: Row[]; note?: string };
  const r = e.rows;
  const title: Record<string, string> = {
    V: `${names(r, 2)}는 최근 3년 문항의 ${r[1].value}% 이상에 기하가 나왔어요`,
    S: `${names(r, 3)}는 문항 10개 중 4개꼴로 경우를 나눠 따져야 해요`,
    B: `${r.filter((x) => x.value === 100).map((x) => x.school).join("·")}는 최근 3년 문항이 모두 약술형이에요`,
    E: `${r[0].school}는 문항 3개 중 1개꼴로 증명을 써야 해요`,
    Q: `${names(r, 2)}는 한 문항에 ${r[1].value}분 남짓이에요`,
    D: `${names(r, 3)}는 ${r[0].minutes}분에 ${r[0].n}문항, 한 문항에 ${r[0].value}분이에요`,
  };
  const timeLabel = (x: Row) => `(${x.minutes}분 ${x.n}문항)`;
  return (
    <figure className="ev">
      <figcaption>{title[pole]}</figcaption>
      <Hbars rows={r} unit={e.unit} label={pole === "Q" || pole === "D" ? timeLabel : undefined} />
      <p className="ev-note">{e.metric}.{e.note ? ` ${e.note}` : ""}</p>
      <p className="ev-src">{pole === "Q" || pole === "D" ? srcExam : srcProfile}</p>
    </figure>
  );
}
