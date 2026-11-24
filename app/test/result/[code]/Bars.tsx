"use client";
import { useSearchParams } from "next/navigation";
import { axes, clarity, poleInfo } from "@/lib/test";

export default function Bars({ code }: { code: string }) {
  const v = useSearchParams().get("v")?.split("-").map(Number);
  const mine = v?.length === 4 && v.every((n) => n >= 0 && n <= 100);
  return (
    <div className="bars">
      {axes.map((ax, i) => {
        const left = mine ? v![i] : code[i] === ax.poles[0] ? 65 : 35;
        return (
          <div key={ax.key} className="bar">
            <div className="bar-name faint">{ax.name}{mine && <> · <b className={`cl cl-${clarity(left)}`}>{clarity(left)}</b> {Math.max(left, 100 - left)}%</>}</div>
            <div className="bar-row">
              <span className={code[i] === ax.poles[0] ? "on" : ""}>{poleInfo[ax.poles[0]].label}</span>
              <div className="track"><span style={{ width: `${left}%` }} /></div>
              <span className={code[i] === ax.poles[1] ? "on" : ""}>{poleInfo[ax.poles[1]].label}</span>
            </div>
          </div>
        );
      })}
      {!mine && <p className="faint">막대는 예시예요. 검사를 하면 내 비율이 표시돼요.</p>}
    </div>
  );
}
