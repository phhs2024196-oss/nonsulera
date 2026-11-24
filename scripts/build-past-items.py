"""오답 노트용 기출 문항 목록(문제 본문 없음, 목록·분류만).
사용법: python3 scripts/build-past-items.py <past_items_meta.jsonl> > lib/data/past-items.json
"""
import json, sys, collections
out = collections.defaultdict(list)
names = {}
for line in open(sys.argv[1], encoding="utf-8"):
    d = json.loads(line)
    if int(d["year"]) < 2021:
        continue
    names[d["school"]] = d["institution"].replace("(서울캠퍼스)", "")
    unit = d.get("unit") or []
    out[d["school"]].append({
        "id": d["id"], "y": int(d["year"]), "tr": d.get("track", ""), "et": d.get("etype", ""),
        "u": " > ".join(unit[:2]), "f": d.get("form", ""), "p": d.get("points"), "t": d.get("tmin"), "lv": d.get("level", ""),
    })
for k in out:
    out[k].sort(key=lambda r: (-r["y"], r["id"]))
json.dump({"built": "2026-11-24", "names": names, "items": out}, sys.stdout, ensure_ascii=False, separators=(",", ":"))
