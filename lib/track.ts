import { cookies, headers } from "next/headers";
import { userClient } from "./supabase/server";

export const VISITOR_COOKIE = "ne_vid";

export type EventType = "test_result" | "page_view" | "download" | "wish" | "click" | "signup" | "profile_update";

/** 모든 행동 기록은 이 함수 하나로 events 표에 쌓인다(회원이면 DB가 user_id를 직접 채움) */
export async function logEvent(type: EventType, data: { path?: string; target?: string; meta?: Record<string, unknown> } = {}) {
  const store = await cookies();
  const h = await headers();
  const row = {
    p_type: type,
    p_visitor: store.get(VISITOR_COOKIE)?.value ?? null,
    p_path: data.path ?? null,
    p_target: data.target ?? null,
    p_referrer: h.get("referer"),
    p_meta: data.meta ?? {},
    p_ua: h.get("user-agent") ?? "",
  };
  const sb = await userClient();
  if (!sb) {
    console.log("[event]", JSON.stringify(row));
    return;
  }
  const { error } = await sb.rpc("log_event", row);
  if (error) console.error("[event] failed", error.message);
}
