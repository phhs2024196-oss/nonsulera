"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { SUPABASE_URL, SUPABASE_ANON } from "@/lib/supabase/env";

// 이메일 로그인은 메일 발송 서버(SMTP)를 연결한 뒤 NEXT_PUBLIC_EMAIL_LOGIN=1 로 연다
const EMAIL_ON = process.env.NEXT_PUBLIC_EMAIL_LOGIN === "1";

type Provider = "kakao" | "google";

export default function LoginForm({ next }: { next: string }) {
  const sb = browserClient();
  const [agree, setAgree] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState<{ kakao: boolean; google: boolean } | null>(null);
  useEffect(() => {
    fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON } })
      .then((r) => r.json())
      .then((d) => setOn({ kakao: !!d.external?.kakao, google: !!d.external?.google }))
      .catch(() => setOn({ kakao: false, google: false }));
  }, []);
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined;

  if (!sb) return <p className="note">로그인은 서버 설정(Supabase 연결) 후 열려요.</p>;

  async function oauth(p: Provider) {
    if (!agree) return setMsg("아래 동의에 체크해 주세요.");
    const { error } = await sb!.auth.signInWithOAuth({ provider: p, options: { redirectTo } });
    if (error) setMsg("지금은 이 방법으로 로그인할 수 없어요. 잠시 뒤 다시 시도해 주세요.");
  }
  async function magic(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return setMsg("아래 동의에 체크해 주세요.");
    const { error } = await sb!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    if (!error) return setMsg("메일로 로그인 링크를 보냈어요. 메일함을 확인해 주세요.");
    setMsg(error.status === 429 ? "요청이 많아요. 잠시 뒤 다시 시도해 주세요." : "보내지 못했어요. 주소를 확인해 주세요.");
  }

  return (
    <div className="form">
      {on?.kakao && <button type="button" className="btn" style={{ background: "#2b2418" }} onClick={() => oauth("kakao")}>카카오로 시작하기</button>}
      {on?.google && <button type="button" className="btn ghost" onClick={() => oauth("google")}>Google로 시작하기</button>}
      {on && !on.kakao && !on.google && !EMAIL_ON && <p className="note">회원 로그인은 곧 열려요. 무료 자료와 유형 검사는 로그인 없이 쓸 수 있어요.</p>}
      {EMAIL_ON && <form onSubmit={magic} style={{ display: "grid", gap: 10, borderTop: "1px solid var(--rule)", paddingTop: 22 }}>
        <label className="f">이메일로 받기
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <button className="btn ghost" type="submit">로그인 링크 받기</button>
      </form>}
      <label className="check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>만 14세 이상이며, <Link href="/privacy">개인정보 처리방침</Link>(수집 항목: 이메일·이름, 이용 기록)에 동의해요.</span>
      </label>
      {msg && <p className="note" role="status">{msg}</p>}
    </div>
  );
}
