"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/** 노트에서 표시하다가 약점 리포트가 새로 나오면 화면 아래에 알려 준다 */
export default function ReportToast() {
  const [id, setId] = useState<number | null>(null);
  useEffect(() => {
    const f = (e: Event) => setId((e as CustomEvent<number>).detail);
    window.addEventListener("ne-report", f);
    return () => window.removeEventListener("ne-report", f);
  }, []);
  if (!id) return null;
  return (
    <div className="toast" role="status">
      다시 볼 문항이 쌓여서 약점 리포트를 만들었어요. <Link href={`/notes/report/${id}`}>리포트 보기</Link>
      <button type="button" onClick={() => setId(null)} aria-label="닫기">×</button>
    </div>
  );
}
