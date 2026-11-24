import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON, SUPABASE_URL, authReady } from "./env";

/**
 * 방문자 권한(공개 키 + 로그인 쿠키)으로 동작하는 클라이언트.
 * 서버 비밀키는 쓰지 않는다. 쓰기·통계는 DB의 검증 함수(log_event, update_my_profile, admin_stats)로만 한다.
 */
export async function userClient() {
  if (!authReady) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* 서버 컴포넌트에서는 쓰기 불가: proxy가 갱신 */
        }
      },
    },
  });
}

export async function currentUser() {
  const sb = await userClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

/** 로그인 없이 공개 데이터만 읽는 클라이언트(캐시 가능한 페이지용) */
export function anonClient() {
  if (!authReady) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
}
