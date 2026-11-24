import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON, SUPABASE_SERVICE, SUPABASE_URL, authReady, dbReady } from "./env";

/** 로그인한 사용자 권한으로 동작하는 클라이언트 (RLS 적용) */
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

/** 서버 전용 관리자 클라이언트 (RLS 우회). 기록 저장·통계에만 사용 */
export function serviceClient() {
  if (!dbReady) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, { auth: { persistSession: false } });
}

export async function currentUser() {
  const sb = await userClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}
