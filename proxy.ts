import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const VISITOR_COOKIE = "ne_vid";

export async function proxy(req: NextRequest) {
  // 첫 방문(외부 링크로 바로 다운로드 등)도 같은 요청 안에서 방문자 번호가 기록되도록 먼저 심는다
  const newVid = req.cookies.get(VISITOR_COOKIE) ? null : crypto.randomUUID();
  if (newVid) req.cookies.set(VISITOR_COOKIE, newVid);
  let res = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const sb = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await sb.auth.getUser(); // 로그인 세션 갱신
  }

  if (newVid) {
    res.cookies.set(VISITOR_COOKIE, newVid, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|files/|sns/|favicon|robots.txt|sitemap.xml|llms\\.txt).*)"],
};
