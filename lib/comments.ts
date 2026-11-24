import "server-only";
import katex from "katex";
import past from "./data/item-comments.json";
import { bookData } from "./data/books";

type Raw = { c?: string[]; w?: string[]; s?: string; st?: string[]; tb?: string[]; cm?: { need?: string; takeaway?: string; caution?: string; review?: string } };
const all: Record<string, Raw> = { ...(past as Record<string, Raw>), ...Object.assign({}, ...bookData.map((b) => b.comments as Record<string, Raw>)) };

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** $...$ 수식은 KaTeX로, 나머지는 글자 그대로 */
export function mathHtml(t: string) {
  return t.split(/(\$[^$]+\$)/g).map((part) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      try { return katex.renderToString(part.slice(1, -1), { throwOnError: false, output: "html" }); } catch { return esc(part); }
    }
    return esc(part);
  }).join("");
}

export function rawComment(id: string) { return all[id]; }

/** 틀렸을 때 보여 줄 코멘트(HTML). 없으면 null */
export function commentFor(id: string) {
  const r = all[id];
  if (!r) return null;
  const h = (x?: string) => (x ? mathHtml(x) : "");
  return {
    review: h(r.cm?.review), caution: h(r.cm?.caution), need: h(r.cm?.need), takeaway: h(r.cm?.takeaway),
    concepts: (r.c ?? []).map(h), conditions: (r.w ?? []).map(h), stuck: h(r.s),
    standards: r.st ?? [], textbooks: r.tb ?? [],
  };
}
