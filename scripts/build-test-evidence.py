"""유형 검사 결과의 '잘 맞는 시험' 근거 데이터 생성.
사용법: python3 scripts/build-test-evidence.py <school_profile.csv> <competition_2026.csv> lib/data/diag.json > lib/data/test-evidence.json
school_profile.csv: 기출 DB(past_items_meta.jsonl) 학교별 요약, 최근 3개년 문항 기준
competition_2026.csv: 2026학년도 입시결과(대학 공개 PDF) 논술 자연계 경쟁률·실질경쟁률
diag.json: 2028 모집요강(학생부 반영 비율) + 2027 모집요강(시험 시간·문항 수)
"""
import csv, json, re, sys

prof = list(csv.DictReader(open(sys.argv[1], encoding="utf-8-sig")))
comp = list(csv.DictReader(open(sys.argv[2], encoding="utf-8-sig")))
diag = json.load(open(sys.argv[3]))["schools"]

def short(n):
    n = n.replace("(서울캠퍼스)", "").replace("한국외국어대학교", "한국외대").replace("서울과학기술대학교", "서울과기대")
    n = n.replace("고려대학교 세종캠퍼스", "고려대(세종)").replace("연세대학교 미래캠퍼스", "연세대(미래)")
    return n.replace("여자대학교", "여대").replace("대학교", "대")

def top(key, k=8, min_n=12):
    rows = [(short(r["institution"]), int(r[key]), int(r["n_recent3"])) for r in prof if r[key] and int(r["n_recent3"]) >= min_n]
    rows = [r for r in rows if r[1] > 0]
    rows.sort(key=lambda r: (-r[1], r[0]))
    return [{"school": s, "value": v, "n": n} for s, v, n in rows[:k]]

def per_item():
    out = []
    for s in diag:
        m, it = s["exam"]["minutes"], s["exam"]["items"]
        if not m or not it or re.search(r"언어논술|인문", s["exam"]["type"] + it):
            continue
        it = re.sub(r"\([^)]*\)", "", it)
        nums = [int(x) for x in re.findall(r"(\d+)\s*(?:문항|문제|개)", it)]
        if "=" in it:
            tot = re.search(r"=\s*(\d+)\s*문항", it)
            n = int(tot.group(1)) if tot else None
        elif re.search(r"\+|·", it) and len(nums) >= 2:
            n = sum(nums[:2])
        elif len(nums) >= 1 and not re.search(r"~|내외|이내|최대", it):
            n = nums[0]
        else:
            n = None
        if n:
            out.append({"school": s["short"], "minutes": int(m), "items": n, "per": round(int(m) / n, 1)})
    return out

pi = per_item()
fast = sorted(pi, key=lambda r: (r["per"], r["school"]))[:8]
slow = sorted([r for r in pi if r["items"] <= 4], key=lambda r: (-r["per"], r["school"]))[:8]

real = []
for r in comp:
    if r["real_rate"] and r["nonsul_rate_natural"] and not r["unsure"]:
        a, b = float(r["nonsul_rate_natural"]), float(r["real_rate"])
        real.append({"school": r["school"], "rate": a, "real": b, "x": round(b / a, 2)})
real.sort(key=lambda r: r["x"])

norec = sorted(s["short"] for s in diag if s["recordPct"] == 0)

json.dump({
    "built": "2026-11-24",
    "V": {"title": "기하 문항이 많은 학교", "unit": "%", "metric": "최근 3개년 수리논술 문항 중 기하가 들어간 비율", "rows": top("pct_기하"),
          "note": "2028학년도부터 수능 수학 범위가 바뀌어요. 기하 출제 여부는 학교별 2028 모집요강에서 다시 확인하세요."},
    "S": {"title": "경우를 나눠 따지는 문항이 많은 학교", "unit": "%", "metric": "최근 3개년 문항 중 풀이 형태가 '분류(경우 나누기)'인 비율", "rows": top("pct_분류")},
    "B": {"title": "약술형(짧은 답) 문항이 많은 학교", "unit": "%", "metric": "최근 3개년 문항 중 약술·단답형 비율", "rows": top("pct_short")},
    "E": {"title": "증명을 쓰게 하는 문항이 많은 학교", "unit": "%", "metric": "최근 3개년 문항 중 증명 서술을 요구한 비율", "rows": top("pct_proof")},
    "Q": {"title": "문항당 시간이 짧은 학교", "unit": "분", "metric": "2027 모집요강의 시험 시간 ÷ 문항 수(국어 문항이 있는 학교는 합산)", "rows": [{"school": r["school"], "value": r["per"], "n": r["items"], "minutes": r["minutes"]} for r in fast]},
    "D": {"title": "한 문항을 오래 푸는 학교", "unit": "분", "metric": "2027 모집요강의 시험 시간 ÷ 문항 수(4문항 이하 학교)", "rows": [{"school": r["school"], "value": r["per"], "n": r["items"], "minutes": r["minutes"]} for r in slow]},
    "A": {"title": "학생부를 반영하지 않는 학교", "count": len(norec), "of": len(diag), "schools": norec},
    "H": {"title": "최저를 맞추면 실제 경쟁률은 이만큼 줄어요", "rows": real},
}, sys.stdout, ensure_ascii=False, indent=1)
