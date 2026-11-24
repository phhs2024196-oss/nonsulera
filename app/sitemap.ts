import type { MetadataRoute } from "next";
import { materials, site } from "@/lib/site";
import { qna } from "@/lib/qna";
import { typeCodes } from "@/lib/test";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${site.url}${p}`;
  return [
    { url: u("/"), priority: 1 },
    { url: u("/materials") },
    ...materials.map((m) => ({ url: u(`/materials/${m.slug}`), lastModified: m.updated })),
    { url: u("/test"), priority: 0.9 },
    ...typeCodes.map((c) => ({ url: u(`/test/result/${c}`) })),
    { url: u("/qna") },
    ...qna.map((x) => ({ url: u(`/qna/${x.slug}`), lastModified: x.updated })),
    { url: u("/books") },
    { url: u("/grading") },
  ];
}
