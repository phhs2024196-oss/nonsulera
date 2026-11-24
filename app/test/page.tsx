import Link from "next/link";
import type { Metadata } from "next";
import Quiz from "./Quiz";
import { types } from "@/lib/test";

export const metadata: Metadata = {
  title: "논술 유형 검사",
  description: "24문항, 3분. 나는 16가지 수리논술 유형 중 어디에 속하고, 어떻게 준비해야 할까.",
};

export default function TestPage() {
  return (
    <div className="wrap article" style={{ maxWidth: 760 }}>
      <div className="kicker sans" style={{ color: "var(--seal)", fontSize: 15, marginBottom: 10 }}>3분 · 24문항</div>
      <h1>논술 유형 검사</h1>
      <p className="muted">
        생각하는 방식, 답안 쓰는 방식, 푸는 속도, 입시 전략. 네 가지 축으로 16가지 유형을 나눠요.
        정답은 없어요. 지금의 나에 가까운 쪽을 고르세요.
      </p>
      <Quiz />
      <h2 style={{ fontSize: 18, margin: "64px 0 12px" }}>16가지 유형</h2>
      <div className="typegrid">
        {Object.entries(types).map(([c, t]) => (
          <Link key={c} href={`/test/result/${c}`}>
            <span className="brush">{t.name}</span>
            <span className="faint">{c}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
