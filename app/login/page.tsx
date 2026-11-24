import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "로그인", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next ?? "/me";
  return (
    <div className="wrap article">
      <h1>로그인</h1>
      <p className="muted">자료는 로그인 없이도 받을 수 있어요. 회원이 되면 새 책·학교편이 나올 때 알려 드리고, 나중에 답안 첨삭 결과를 모아 볼 수 있어요.</p>
      <LoginForm next={next.startsWith("/") ? next : "/me"} />
    </div>
  );
}
