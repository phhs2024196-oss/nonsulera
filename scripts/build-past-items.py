"""오답 노트용 기출 문항 목록(문제 본문 없음, 목록·분류만) + 비슷한 기출 미리 계산.
사용법: python3 scripts/build-past-items.py <past_items_meta.jsonl> > lib/data/past-items.json
비슷한 기출 점수: 같은 핵심 아이디어 4점, 같은 요소·소재 태그 2점, 같은 단원 1점, 같은 풀이 형태 0.5점, 다른 학교 0.5점. 3점 이상만 최대 3개.
"""
import json, sys, collections, re
rows, names = [], {}
codes = set()
for line in open(sys.argv[1], encoding="utf-8"):
    d = json.loads(line)
    codes.add(d["school"])
    if int(d["year"]) < 2021:
        continue
    rows.append(d)
    names[d["school"]] = d["institution"].replace("(서울캠퍼스)", "")

def clean_tags(t):
    return [x for x in (t or []) if x not in codes and x not in ("기출", "모의논술", "수시") and not re.fullmatch(r"\d{4}.*", x) and not x.endswith("모의")][:6]

items = {}
for d in rows:
    unit = d.get("unit") or []
    items[d["id"]] = {
        "id": d["id"], "s": d["school"], "y": int(d["year"]), "tr": d.get("track", ""), "et": d.get("etype", ""),
        "u": " > ".join(unit[:2]), "f": d.get("form", ""), "p": d.get("points"), "t": d.get("tmin"), "lv": d.get("level", ""),
        "tg": clean_tags(d.get("tags")), "_idea": set(d.get("idea") or []),
    }

by_idea, by_tag = collections.defaultdict(set), collections.defaultdict(set)
for it in items.values():
    for x in it["_idea"]: by_idea[x].add(it["id"])
    for x in it["tg"]: by_tag[x].add(it["id"])

for it in items.values():
    cand = collections.Counter()
    for x in it["_idea"]:
        for o in by_idea[x]: cand[o] += 4
    for x in it["tg"]:
        if len(by_tag[x]) <= 150:  # 너무 흔한 태그는 비슷함의 근거가 약하다
            for o in by_tag[x]: cand[o] += 2
    cand.pop(it["id"], None)
    scored = []
    for o, sc in cand.items():
        ot = items[o]
        sc += (1 if ot["u"] == it["u"] else 0) + (0.5 if ot["f"] == it["f"] else 0) + (0.5 if ot["s"] != it["s"] else 0)
        if sc >= 3: scored.append((-sc, -ot["y"], o))
    it["sim"] = [o for _, _, o in sorted(scored)[:3]]

out = collections.defaultdict(list)
for it in items.values():
    it.pop("_idea")
    out[it.pop("s")].append(it)
for k in out:
    out[k].sort(key=lambda r: (-r["y"], r["id"]))
json.dump({"built": "2026-11-24", "names": names, "items": out}, sys.stdout, ensure_ascii=False, separators=(",", ":"))
