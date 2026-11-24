import Link from "next/link";
import type { Metadata } from "next";
import WishButton from "@/components/WishButton";
import { materials } from "@/lib/site";

export const metadata: Metadata = { title: "무료 자료", description: "논술의 시대가 무료로 배포하는 수리논술 자료." };

export default function Materials() {
  return (
    <div className="wrap article" style={{ maxWidth: 1080 }}>
      <h1>무료 자료</h1>
      <div className="rows">
        {materials.map((m) => (
          <div className="row" key={m.slug}>
            <div>
              <Link href={`/materials/${m.slug}`} style={{ textDecoration: "none" }}><span className="t brush">{m.title}</span></Link>{" "}
              <span className="k">({m.kind})</span>
              <p className="d">{m.summary}</p>
            </div>
            {m.file ? (
              <a className="btn" href={`/api/download/${m.slug}?from=materials`}>PDF 받기</a>
            ) : (
              <WishButton target={m.slug} label="나오면 받을래요" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
