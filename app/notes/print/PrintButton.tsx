"use client";
export default function PrintButton() {
  return <button type="button" className="btn ghost" onClick={() => window.print()}>인쇄·PDF 저장</button>;
}
