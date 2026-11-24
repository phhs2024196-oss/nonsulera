/** 가로 막대(값 큰 순, 값은 막대 끝에 직접). 앞쪽 2개만 강조색 */
export default function Bars({ rows, unit = "", max }: { rows: { k: string; v: number; sub?: string; hot?: boolean }[]; unit?: string; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="hbars">
      {rows.map((r, i) => (
        <div className="hb" key={r.k}>
          <span className="hb-n" title={r.k}>{r.k}</span>
          <span className="hb-t"><i className={r.hot ?? i < 2 ? "hot" : ""} style={{ width: `${(r.v / m) * 100}%` }} /></span>
          <span className="hb-v">{r.v}{unit}{r.sub ? <small> {r.sub}</small> : null}</span>
        </div>
      ))}
    </div>
  );
}
