"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/browser";

export default function AuthLink() {
  const [inUser, setIn] = useState(false);
  useEffect(() => {
    const sb = browserClient();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setIn(Boolean(data.session)));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setIn(Boolean(s)));
    return () => data.subscription.unsubscribe();
  }, []);
  return <Link href={inUser ? "/me" : "/login"}>{inUser ? "내 정보" : "로그인"}</Link>;
}
