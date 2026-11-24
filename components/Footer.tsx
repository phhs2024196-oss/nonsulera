import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo_main.png" alt="논술의 시대" width={96} height={57} style={{ mixBlendMode: "multiply" }} />
          <div>수리논술만 다룹니다.</div>
        </div>
        <nav>
          <a href={site.instagram} rel="noopener" target="_blank">인스타그램</a>
          <a href={site.youtube} rel="noopener" target="_blank">유튜브</a>
          <Link href="/privacy">개인정보 처리방침</Link>
        </nav>
      </div>
    </footer>
  );
}
