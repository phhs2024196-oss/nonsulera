#!/usr/bin/env bash
# 사용법: scripts/sns-add.sh <날짜 YYYY-MM-DD> <파일1> [파일2 ...]
# 파일을 public/sns/<날짜>/ 로 복사하고 작업 브랜치에 커밋·푸시한다. 배포는 Vercel create_deployment(아래)로.
set -euo pipefail
d="$1"; shift
[[ "$d" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "날짜 형식: YYYY-MM-DD"; exit 1; }
cd "$(dirname "$0")/.."
mkdir -p "public/sns/$d"
for f in "$@"; do
  name="$(basename "$f")"
  [[ "$name" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "파일명은 영문·숫자·.-_ 만: $name"; exit 1; }
  size=$(stat -c %s "$f")
  (( size < 95000000 )) || { echo "95MB 넘음(GitHub 한도 100MB): $name"; exit 1; }
  cp "$f" "public/sns/$d/$name"
  echo "https://nonsulera.vercel.app/sns/$d/$name"
done
git add "public/sns/$d"
git commit -q -m "SNS 미디어 추가 ($d)"
git push -q origin HEAD
echo "푸시 완료. 이제 Vercel 운영 배포를 실행하세요(README의 'SNS 미디어' 참고)."
