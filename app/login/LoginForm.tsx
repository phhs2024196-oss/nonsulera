"use client";
import Link from "next/link";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";

type Provider = "kakao" | "google";

export default function LoginForm({ next }: { next: string }) {
  const sb = browserClient();
  const [agree, setAgree] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined;

  if (!sb) return <p className="note">로그인은 서버 설정(Supabase 연결) 후 열려요.</p>;

  async function oauth(p: Provider) {
    if (!agree) return setMsg("아래 동의에 체크해 주세요.");
    await sb!.auth.signInWithOAuth({ provider: p, options: { redirectTo } });
  }
  async function magic(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return setMsg("아래 동의에 체크해 주세요.");
    const { error } = await sb!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setMsg(error ? "보내지 못했어요. 주소를 확인해 주세요." : "메일로 로그인 링크를 보냈어요. 메일함을 확인해 주세요.");
  }

  return (
    <div className="form">
      <button type="button" className="btn" style={{ background: "#2b2418" }} onClick={() => oauth("kakao")}>카카오로 시작하기</button>
      <button type="button" className="btn ghost" onClick={() => oauth("google")}>Google로 시작하기</button>
      <form onSubmit={magic} style={{ display: "grid", gap: 10, borderTop: "1px solid var(--rule)", paddingTop: 22 }}>
        <label className="f">이메일로 받기
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <button className="btn ghost" type="submit">로그인 링크 받기</button>
      </form>
      <label className="check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>만 14세 이상이며, <Link href="/privacy">개인정보 처리방침</Link>(수집 항목: 이메일·이름, 이용 기록)에 동의해요.</span>
      </label>
      {msg && <p className="note" role="status">{msg}</p>}
    </div>
  );
}
