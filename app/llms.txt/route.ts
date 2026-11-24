import { materials, site } from "@/lib/site";
import { qna } from "@/lib/qna";

export const dynamic = "force-static";

export function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "## 무료 자료",
    ...materials.filter((m) => m.file).map((m) => `- [${m.title}(${m.kind})](${site.url}/materials/${m.slug}): ${m.summary}`),
    "",
    "## 묻고 답하기",
    ...qna.map((x) => `- [${x.q}](${site.url}/qna/${x.slug}): ${x.short}`),
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
