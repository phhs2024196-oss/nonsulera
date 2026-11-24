import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ProfileForm from "./ProfileForm";
import { currentUser, serviceClient } from "@/lib/supabase/server";
import { books, grades, strengths } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "내 정보", robots: { index: false } };

export default async function Me() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/me");
  const { data } = (await serviceClient()?.from("profiles").select("*").eq("id", user.id).single()) ?? { data: null };
  const initial = {
    nickname: data?.nickname ?? "",
    grade: data?.grade ?? "",
    target_schools: data?.target_schools ?? [],
    strengths: data?.strengths ?? [],
    wanted_books: data?.wanted_books ?? [],
    marketing_ok: data?.marketing_ok ?? false,
  };
  return (
    <div className="wrap article">
      <h1>내 정보</h1>
      <p className="muted">알려 주시면 필요한 책부터 만들고, 맞는 학교편을 먼저 보내 드릴게요. 모두 선택이에요.</p>
      <ProfileForm initial={initial} grades={grades} strengths={strengths} books={books} />
    </div>
  );
}
