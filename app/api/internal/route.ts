import { NextResponse, type NextRequest } from "next/server";

/** 대표·운영자 기기 표시: /api/internal?k=<INTERNAL_KEY> 를 한 번 열면 그 브라우저의 활동은 통계에 기록되지 않는다. ?off=1 이면 해제 */
export async function GET(req: NextRequest) {
  const key = process.env.INTERNAL_KEY;
  const res = NextResponse.redirect(new URL("/", req.url), 302);
  if (!key || req.nextUrl.searchParams.get("k") !== key) return res;
  if (req.nextUrl.searchParams.get("off") === "1") {
    res.cookies.delete("ne_internal");
  } else {
    res.cookies.set("ne_internal", key, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 730 });
  }
  return res;
}
