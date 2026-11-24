"use client";
import { useState } from "react";

export default function Share({ title }: { title: string }) {
  const [msg, setMsg] = useState("");
  async function share() {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setMsg("링크를 복사했어요."); }
    } catch { /* 취소 */ }
  }
  return (
    <>
      <button type="button" className="btn ghost" onClick={share}>결과 공유하기</button>
      {msg && <span className="faint" style={{ alignSelf: "center" }}>{msg}</span>}
    </>
  );
}
