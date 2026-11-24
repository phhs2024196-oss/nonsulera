import { NextResponse, type NextRequest } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { books, grades, strengths } from "@/lib/site";
import { logEvent } from "@/lib/track";

const pick = (v: unknown, allow: string[]) => (Array.isArray(v) ? v.filter((x) => allow.includes(x)) : []);

export async function POST(req: NextRequest) {
  const sb = await userClient();
  if (!sb) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const grade = grades.includes(b.grade) ? b.grade : null;
  const { error } = await sb.rpc("update_my_profile", {
    p_nickname: typeof b.nickname === "string" ? b.nickname.slice(0, 20) : null,
    p_grade: grade,
    p_target_schools: Array.isArray(b.target_schools)
      ? b.target_schools.map((s: unknown) => String(s).trim().slice(0, 20)).filter(Boolean).slice(0, 6)
      : [],
    p_strengths: pick(b.strengths, strengths),
    p_wanted_books: pick(b.wanted_books, books.map((x) => x.key)),
    p_marketing_ok: b.marketing_ok === true,
  });
  if (error) return NextResponse.json({ ok: false }, { status: 401 });
  await logEvent("profile_update", { meta: { grade } });
  return NextResponse.json({ ok: true });
}
