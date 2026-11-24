import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL } from "@/lib/supabase/env";

// Supabase는 카카오에 이메일·프로필 사진까지 기본으로 요청한다.
// 비즈 앱이 아니면 이메일 동의항목을 쓸 수 없어 KOE205가 나므로, 카카오로 넘기기 전에 닉네임만 요청하도록 바꾼다.
export async function GET(req: NextRequest) {
  const back = new URL("/login?e=kakao", req.url);
  const u = req.nextUrl.searchParams.get("u");
  if (!u || !SUPABASE_URL || !u.startsWith(`${SUPABASE_URL}/auth/v1/authorize?`)) return NextResponse.redirect(back);
  const r = await fetch(u, { redirect: "manual" });
  const loc = r.headers.get("location");
  if (!loc) return NextResponse.redirect(back);
  const k = new URL(loc);
  if (k.hostname !== "kauth.kakao.com") return NextResponse.redirect(back);
  k.searchParams.set("scope", "profile_nickname");
  return NextResponse.redirect(k.toString());
}
