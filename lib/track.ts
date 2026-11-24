import { cookies, headers } from "next/headers";
import { serviceClient, currentUser } from "./supabase/server";

export const VISITOR_COOKIE = "ne_vid";

export type EventType = "test_result" | "page_view" | "download" | "wish" | "click" | "signup" | "profile_update";

/** 모든 행동 기록은 이 함수 하나로 events 테이블에 쌓인다 */
export async function logEvent(type: EventType, data: { path?: string; target?: string; meta?: Record<string, unknown> } = {}) {
  const sb = serviceClient();
  const store = await cookies();
  const h = await headers();
  const user = await currentUser().catch(() => null);
  const row = {
    type,
    visitor_id: store.get(VISITOR_COOKIE)?.value ?? null,
    user_id: user?.id ?? null,
    path: data.path ?? null,
    target: data.target ?? null,
    referrer: h.get("referer"),
    meta: data.meta ?? {},
  };
  if (!sb) {
    console.log("[event]", JSON.stringify(row));
    return;
  }
  const { error } = await sb.from("events").insert(row);
  if (error) console.error("[event] insert failed", error.message);
}
