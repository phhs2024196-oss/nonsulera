"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Tracker() {
  const path = usePathname();
  const sp = useSearchParams();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const body: Record<string, string> = { type: "page_view", path };
    for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
      const v = sp.get(k);
      if (v) body[k] = v;
    }
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
  }, [path, sp]);
  return null;
}
