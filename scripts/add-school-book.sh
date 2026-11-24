#!/usr/bin/env bash
# 학교편 지피지기 공개: 검증 통과 PDF를 사이트에 올린다.
# 사용법: scripts/add-school-book.sh <학교코드> [학교 이름]
#   원본: /mnt/project-files/site/school-books/<코드>/jipijigi-<코드소문자>.pdf
#   결과: public/files/schools/jipijigi-<코드소문자>.pdf, lib/data/school-books.json 갱신 → 커밋
#   다운로드 주소: /download/jipijigi-<코드소문자> (회원 전용, 학교별로 다운로드 집계)
set -euo pipefail
cd "$(dirname "$0")/.."
CODE=$(echo "$1" | tr '[:lower:]' '[:upper:]'); low=$(echo "$CODE" | tr '[:upper:]' '[:lower:]')
DIR="${SCHOOL_BOOKS_DIR:-/mnt/project-files/site/school-books}"
SRC="$DIR/${CODE}/jipijigi-${low}.pdf"
[ -f "$SRC" ] || SRC="$DIR/${low}/jipijigi-${low}.pdf"
[ -f "$SRC" ] || { echo "PDF 없음: $SRC"; exit 1; }
size=$(stat -c %s "$SRC"); [ "$size" -lt 95000000 ] || { echo "95MB 초과"; exit 1; }
cp "$SRC" "public/files/schools/jipijigi-${low}.pdf"
pages=$(pdfinfo "$SRC" 2>/dev/null | awk '/^Pages:/{print $2}')
NAME="${2:-}"
python3 - "$CODE" "$low" "${pages:-0}" "$NAME" <<'PY'
import json, sys, datetime
code, low, pages, name = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
if not name:
    for src in ("lib/data/diag.json",):
        d = json.load(open(src))
        name = next((s["short"] for s in d["schools"] if s["code"] == code), "")
    if not name:
        p = json.load(open("lib/data/past-items.json"))["names"].get(code, code)
        name = p.replace("여자대학교", "여대").replace("대학교", "대")
p = "lib/data/school-books.json"
rows = [r for r in json.load(open(p)) if r["code"] != code]
rows.append({"code": code, "name": name, "file": f"/files/schools/jipijigi-{low}.pdf",
             "updated": (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)).strftime("%Y-%m-%d"), "pages": pages or None})
rows.sort(key=lambda r: r["name"])
json.dump(rows, open(p, "w"), ensure_ascii=False, indent=1)
print(f"{name} 학교편 {pages}쪽 추가 → /download/jipijigi-{low}")
PY
git add "public/files/schools/jipijigi-${low}.pdf" lib/data/school-books.json
git commit -qm "Publish school book jipijigi-${low}"
