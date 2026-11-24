import Link from "next/link";
import AuthLink from "./AuthLink";

const links = [
  { href: "/test", label: "유형 검사" },
  { href: "/materials", label: "무료 자료" },
  { href: "/books", label: "교재" },
  { href: "/grading", label: "답안 첨삭" },
  { href: "/qna", label: "묻고 답하기" },
];

export default function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="논술의 시대 처음으로">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo_main.png" alt="논술의 시대" width={74} height={44} />
        </Link>
        <nav className="nav">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
          <AuthLink />
        </nav>
      </div>
    </header>
  );
}
