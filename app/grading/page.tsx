import Link from "next/link";
import type { Metadata } from "next";
import WishButton from "@/components/WishButton";

export const metadata: Metadata = { title: "답안 첨삭", description: "수리논술 답안을 올리면 대학 채점 기준에 맞춰 첨삭해 주는 서비스(준비 중)." };

export default function Grading() {
  return (
    <div className="wrap article">
      <h1>답안 첨삭</h1>
      <p className="answer">쓴 답안을 사진으로 올리면, 대학이 공개한 채점 기준에 맞춰 어느 단계에서 점수가 났고 어디서 깎였는지 알려 드리는 서비스를 준비하고 있어요.</p>
      <p>사람 채점과 결과가 충분히 일치한다고 확인되기 전까지는 공개하지 않아요. 열리면 가장 먼저 알려 드릴게요.</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <WishButton target="grading" label="열리면 써 볼래요" />
        <Link className="btn ghost" href="/login?next=/me">회원으로 알림 받기</Link>
      </div>
    </div>
  );
}
