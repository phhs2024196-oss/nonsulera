import { NextResponse, type NextRequest } from "next/server";
import { userClient, currentUser } from "@/lib/supabase/server";
import { pastItems } from "@/lib/notes";

/** 오답 노트 저장: 문항 하나의 상태(풀었음·틀림·다시 풀기, 빈 값이면 삭제)와 메모 */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const school = String(b.school ?? "");
  const item = String(b.item ?? "");
  if (!pastItems[school]?.some((x) => x.id === item)) return NextResponse.json({ error: "bad item" }, { status: 400 });
  const status = ["solved", "wrong", "retry"].includes(b.status) ? b.status : "";
  const sb = await userClient();
  const { error } = (await sb?.rpc("save_note", { p_item: item, p_school: school, p_status: status, p_memo: String(b.memo ?? "").slice(0, 1000) })) ?? {};
  return error ? NextResponse.json({ error: "save" }, { status: 500 }) : NextResponse.json({ ok: true });
}
