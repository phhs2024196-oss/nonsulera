"""내 대학 진단용 데이터 생성.
사용법: python3 scripts/build-diag.py <모집요강 summary.csv> <competition_2026.csv> > lib/data/diag.json
summary.csv: 사업 저장소 nonsul-era/admission/summary.csv (2025~2028 모집요강 DB)
"""
import csv, json, re, sys, collections

rows = list(csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")))
comp = {r["school"]: r for r in csv.DictReader(open(sys.argv[2], encoding="utf-8-sig"))}
by = collections.defaultdict(dict)
for r in rows:
    by[r["code"]][r["year"]] = r

def short(name):
    s = name.replace("한국외국어대학교", "한국외대").replace("서울과학기술대학교", "서울과기대").replace("여자대학교", "여대")
    return s.replace("대학교", "대")

def parts(cell):
    out = []
    for seg in (cell or "").split(" | "):
        d = {}
        for m in re.finditer(r"(\w+)=((?:\[[^\]]*\])|[^,]*(?:,(?!\s*\w+=)[^,]*)*)", seg):
            d[m.group(1)] = m.group(2).strip()
        if d: out.append(d)
    return out

def math_exam(cell):
    segs = parts(cell)
    for d in segs:
        t = d.get("type", "")
        if re.search(r"수리|자연|공학|수학|전 계열|계열 구분 없음|전 모집단위", t) and not t.startswith("인문"):
            return d
    for d in segs:
        if "수학" in d.get("items", "") or "수학" in d.get("subjects", ""):
            return d
    return None

out = []
for code, ys in sorted(by.items(), key=lambda kv: kv[1].get("2028", {}).get("school", "")):
    r28 = ys.get("2028")
    if not r28 or r28.get("nonsul") != "True":
        continue
    r27 = ys.get("2027") or {}
    ex = math_exam(r27.get("exam")) or math_exam(r28.get("exam")) or {}
    dates = sorted({d.get("date") for d in parts(r27.get("schedule")) if d.get("date")})
    csat = [{"who": d.get("a", ""), "rule": d.get("r", "")} for d in parts(r28.get("csat_min"))] or ([{"who": "", "rule": r28["csat_min"]}] if r28.get("csat_min") else [])
    ratio = r28.get("ratio", "")
    rec = sum(int(x) for x in re.findall(r"(?:학생부|교과|출결)[^;\d]*(\d+)", ratio))
    nm = r28["school"]
    c = comp.get(short(nm)) or comp.get(nm.replace("학교", "")) or {}
    out.append({
        "code": code, "name": nm, "short": short(nm),
        "quota": r28.get("total_quota", ""), "ratio": ratio, "recordPct": rec,
        "csat": csat,
        "noCsat": all(re.fullmatch(r"\s*없음\s*", x["rule"]) for x in csat if re.search(r"그 외|자연|일반|전 모집", x["who"] or "전 모집")) if csat else True,
        "exam": {"minutes": ex.get("minutes", ""), "items": ex.get("items", ""), "type": ex.get("type", "")},
        "dates2027": dates,
        "rate2026": c.get("nonsul_rate_natural", ""),
        "src": r28.get("url", ""),
    })
json.dump({"year": 2028, "built": "2026-11-24", "schools": out}, sys.stdout, ensure_ascii=False, indent=1)
