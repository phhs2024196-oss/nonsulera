import type { Metadata } from "next";
import WishButton from "@/components/WishButton";
import { books } from "@/lib/site";

export const metadata: Metadata = { title: "교재", description: "논술의 시대 수리논술 교재 지도." };

export default function Books() {
  return (
    <div className="wrap article" style={{ maxWidth: 1080 }}>
      <h1>교재</h1>
      <p className="muted" style={{ maxWidth: "36em" }}>
        개념, 생각하는 법, 학교 색깔, 실전 순서로 이어지는 책들이에요. 아직 출간 전이에요. 먼저 나왔으면 하는 책에 표시해 주시면 그 순서대로 만들어요.
      </p>
      <div className="rows">
        {books.map((b) => (
          <div className="row" key={b.key}>
            <div><span className="t brush">{b.title}</span> <span className="k">({b.kind})</span></div>
            <WishButton target={b.key} />
          </div>
        ))}
      </div>
    </div>
  );
}
