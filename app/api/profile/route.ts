import { NextResponse, type NextRequest } from "next/server";
import { currentUser, serviceClient } from "@/lib/supabase/server";
import { books, grades, strengths } from "@/lib/site";
import { logEvent } from "@/lib/track";

const pick = (v: unknown, allow: string[]) => (Array.isArray(v) ? v.filter((x) => allow.includes(x)) : []);

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const sb = serviceClient();
  if (!user || !sb) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const row = {
    nickname: typeof b.nickname === "string" ? b.nickname.slice(0, 20) : null,
    grade: grades.includes(b.grade) ? b.grade : null,
    target_schools: Array.isArray(b.target_schools)
      ? b.target_schools.map((s: unknown) => String(s).trim().slice(0, 20)).filter(Boolean).slice(0, 6)
      : [],
    strengths: pick(b.strengths, strengths),
    wanted_books: pick(b.wanted_books, books.map((x) => x.key)),
    marketing_ok: b.marketing_ok === true,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("profiles").update(row).eq("id", user.id);
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  await logEvent("profile_update", { meta: { grade: row.grade } });
  return NextResponse.json({ ok: true });
}
