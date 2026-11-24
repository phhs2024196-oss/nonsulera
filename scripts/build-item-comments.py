"""오답 코멘트 데이터: 문항 YAML(기출 DB·우리 교재 공통 스키마 2.0)에서 '다시 볼 것'과 '주의할 점'을 뽑는다.
사용법: python3 scripts/build-item-comments.py <items 폴더> [<items 폴더> ...] > lib/data/item-comments.json
뽑는 필드(문제 본문·전체 풀이·key_idea는 넣지 않는다):
  c  다시 볼 개념      elements.concepts 앞 4개
  w  주의할 조건      elements.conditions 앞 3개
  s  막히는 단계      stuck
  st 교육과정 성취기준 curriculum.standards[].text 앞 2개
  tb 교과서 쪽        curriculum.textbooks 앞 2개
  cm 교재 코멘트      comment.{need,takeaway,caution,review} (우리 교재 문항에만 있음)
"""
import glob, json, os, sys, yaml

def s(x, n=220):
    x = " ".join(str(x or "").split())
    if len(x) <= n:
        return x
    x = x[: n - 1]
    if x.count("$") % 2:  # 수식 중간에서 잘리면 그 수식은 통째로 뺀다
        x = x[: x.rfind("$")]
    return x.rstrip(" ,·") + "…"

out = {}
for d in sys.argv[1:]:
    for f in sorted(glob.glob(os.path.join(d, "**", "*.yaml"), recursive=True)):
        try:
            y = yaml.safe_load(open(f, encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(y, dict) or "id" not in y:
            continue
        el = y.get("elements") or {}
        cur = y.get("curriculum") or {}
        rec = {
            "c": [s(x, 120) for x in (el.get("concepts") or [])[:4]],
            "w": [s(x, 200) for x in (el.get("conditions") or [])[:3]],
            "s": s(y.get("stuck"), 260),
            "st": [s(x.get("text"), 120) for x in (cur.get("standards") or [])[:2] if isinstance(x, dict)],
            "tb": [s(x, 80) for x in (cur.get("textbooks") or [])[:2]],
        }
        cm = y.get("comment") or {}
        if isinstance(cm, dict) and cm:
            rec["cm"] = {k: s(v, 260) for k, v in cm.items() if k in ("need", "takeaway", "caution", "review") and v}
        out[y["id"]] = {k: v for k, v in rec.items() if v}
json.dump(out, sys.stdout, ensure_ascii=False, separators=(",", ":"))
