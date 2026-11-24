import { NextResponse, type NextRequest } from "next/server";
import { userClient, currentUser } from "@/lib/supabase/server";

const topics = ["학교 고르기", "수능 최저", "공부 순서", "기출 풀이", "답안 쓰기", "교재", "기타"];

/** 질문 접수(회원만). 하루 5개까지, 공개 여부는 질문한 사람이 고른다 */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const body = String(b.body ?? "").trim();
  if (body.length < 10) return NextResponse.json({ error: "short" }, { status: 400 });
  const topic = topics.includes(b.topic) ? b.topic : "기타";
  const sb = await userClient();
  const { data, error } = (await sb?.rpc("ask_question", { p_topic: topic, p_body: body.slice(0, 3000), p_public: !!b.public })) ?? {};
  if (error) return NextResponse.json({ error: /too many/.test(error.message) ? "many" : "save" }, { status: 400 });
  return NextResponse.json({ ok: true, id: data });
}
