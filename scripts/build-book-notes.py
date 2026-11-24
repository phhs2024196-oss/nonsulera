"""우리 교재 문항 → 사이트 오답 노트 자동 생성.
사용법: python3 scripts/build-book-notes.py <교재키> <교재 문항 YAML 폴더>
  예) python3 scripts/build-book-notes.py yuyu ../-/nonsul-era/items/BOOK/yuyu
결과: lib/data/books/<교재키>.json(문항 목록·코멘트·비슷한 기출) + lib/data/books/index.ts 갱신.
교재키는 lib/site.ts의 books[].key와 같아야 한다(제목·종류를 거기서 가져온다).
문항 YAML은 기출 DB와 같은 스키마 2.0. 교재용으로 아래를 더 쓴다(없으면 빈칸).
  book_no: 교재 안 번호(예: "3-12"), chapter: 장 제목
  comment: {need: 필요 개념, takeaway: 얻어 갈 점, caution: 주의할 점, review: 틀렸다면 다시 볼 것}
"""
import glob, json, os, re, subprocess, sys, yaml

key, folder = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
site = open(os.path.join(root, "lib/site.ts"), encoding="utf-8").read()
m = re.search(r'\{\s*key:\s*"%s",\s*title:\s*"([^"]+)",\s*kind:\s*"([^"]+)"' % re.escape(key), site)
if not m:
    sys.exit(f"lib/site.ts books에 key '{key}'가 없어요")
title, kind = m.group(1), m.group(2)

past = json.load(open(os.path.join(root, "lib/data/past-items.json"), encoding="utf-8"))
past_all = [dict(it, s=s) for s, lst in past["items"].items() for it in lst]

def s(x, n=260):
    x = " ".join(str(x or "").split())
    if len(x) <= n: return x
    x = x[: n - 1]
    if x.count("$") % 2: x = x[: x.rfind("$")]
    return x.rstrip(" ,·") + "…"

items, comments = [], {}
for f in sorted(glob.glob(os.path.join(folder, "**", "*.yaml"), recursive=True)):
    y = yaml.safe_load(open(f, encoding="utf-8"))
    if not isinstance(y, dict) or "id" not in y:
        continue
    unit = ((y.get("curriculum") or {}).get("units")) or y.get("unit") or []
    subj = (y.get("curriculum") or {}).get("subjects") or []
    u = " > ".join((unit if isinstance(unit, list) else [unit])[:2]) or " > ".join(subj[:1])
    tg = [t for t in (y.get("tags") or [])][:6]
    # 비슷한 기출: 같은 태그 2점, 같은 단원 1점, 같은 풀이 형태 0.5점
    sc = []
    for p in past_all:
        v = 2 * len(set(tg) & set(p["tg"])) + (1 if u and p["u"] == u else 0) + (0.5 if p["f"] == y.get("form") else 0)
        if v >= 2.5: sc.append((-v, -p["y"], p["id"]))
    items.append({
        "id": y["id"], "y": 0, "no": str(y.get("book_no") or ""), "tr": s(y.get("chapter"), 40), "et": title,
        "u": u, "f": y.get("form") or "", "p": y.get("points"), "t": y.get("time_estimate_min"), "lv": y.get("level") or "",
        "tg": tg, "sim": [i for _, _, i in sorted(sc)[:3]],
    })
    el = y.get("elements") or {}
    cm = y.get("comment") or {}
    rec = {"c": [s(x, 120) for x in (el.get("concepts") or [])[:4]], "w": [s(x, 200) for x in (el.get("conditions") or [])[:3]],
           "s": s(y.get("stuck")), "cm": {k: s(v) for k, v in cm.items() if k in ("need", "takeaway", "caution", "review") and v}}
    comments[y["id"]] = {k: v for k, v in rec.items() if v}

if not items:
    sys.exit("문항 YAML이 없어요")
os.makedirs(os.path.join(root, "lib/data/books"), exist_ok=True)
json.dump({"key": key, "title": title, "kind": kind, "built": subprocess.run(["date", "+%F"], capture_output=True, text=True).stdout.strip(),
           "items": items, "comments": comments},
          open(os.path.join(root, f"lib/data/books/{key}.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

keys = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(root, "lib/data/books/*.json")))
with open(os.path.join(root, "lib/data/books/index.ts"), "w", encoding="utf-8") as w:
    w.write("// scripts/build-book-notes.py가 자동으로 쓰는 파일. 손으로 고치지 않는다.\n")
    for k in keys:
        w.write(f'import b_{k.replace("-", "_")} from "./{k}.json";\n')
    w.write("export const bookData = [" + ", ".join(f'b_{k.replace("-", "_")}' for k in keys) + "];\n")
print(f"{title}({kind}) {len(items)}문항 → lib/data/books/{key}.json")
