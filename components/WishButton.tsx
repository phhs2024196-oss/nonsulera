"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "ne_wish";
function load(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export default function WishButton({ target, label = "기다려요" }: { target: string; label?: string }) {
  const path = usePathname();
  const [on, setOn] = useState(false);
  useEffect(() => setOn(load().includes(target)), [target]);
  async function click() {
    if (on) return;
    setOn(true);
    try { localStorage.setItem(KEY, JSON.stringify([...load(), target])); } catch {}
    await fetch("/api/wish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target, path }) }).catch(() => {});
  }
  return (
    <button type="button" className={`wish${on ? " on" : ""}`} onClick={click} aria-pressed={on}>
      {on ? "표시했어요" : label}
    </button>
  );
}
