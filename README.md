# 논술의 시대 공식 사이트

수리논술 무료 자료 배포, 회원, 행동 기록(다운로드·관심 표시·유입), 운영 현황 페이지.
나중에 같은 사이트에 답안 첨삭과 교재 판매를 붙인다(`supabase/FUTURE.md`).

- 화면: Next.js 16 (App Router)
- 회원·데이터: Supabase (무료 플랜: DB 500MB, 월 활성 사용자 5만)
- 배포: Vercel 또는 Cloudflare (아래 참고)

## 처음 켜기
1. Supabase 프로젝트 생성 → SQL Editor에 `supabase/migrations/0001_init.sql`, `0002_rpc.sql` 순서로 실행 (서버 비밀키 불필요)
2. Authentication > Providers에서 Kakao·Google 켜기(각 개발자 콘솔에서 키 발급), Email은 기본 켜짐
3. `.env.example`을 `.env.local`로 복사해 값 채우기
4. `npm install && npm run dev` → http://localhost:3000
5. 대표 계정으로 로그인 → SQL 맨 아래 주석의 `update ... is_admin = true` 실행 → `/admin`에서 통계 확인

환경변수가 없어도 사이트는 열린다(로그인 비활성, 기록은 서버 로그로만 출력).

## 자료 추가·교체
- 파일을 `public/files/`에 넣고 `lib/site.ts`의 `materials`에 한 줄 추가
- 다운로드 링크는 항상 `/api/download/<slug>` (여기서 횟수를 센 뒤 파일로 보냄). 외부 홍보 링크에는 `?utm_source=instagram`처럼 출처를 붙이면 유입별로 집계된다
- `public/files/jipijigi.pdf`를 바꿔 main에 푸시하면 기존 GitHub 릴리스 링크도 계속 갱신된다(이미 퍼진 링크 유지용)

## 모이는 데이터 (events 표 하나 + profiles)
| 종류 | 언제 |
|---|---|
| page_view | 페이지를 볼 때 (유입 경로, utm 포함) |
| download | 자료를 받을 때 |
| wish | 준비 중인 책·서비스에 "기다려요"를 누를 때 (비회원 포함) |
| signup / profile_update | 가입, 내 정보 저장 |

회원 정보: 학년, 목표 학교, 자신 있는 과목, 먼저 받고 싶은 책, 소식 수신 동의.

## 배포 주의
Vercel 무료(Hobby)는 비상업 용도 한정이다. 무료 배포 단계는 괜찮지만 판매를 시작하면 Vercel Pro(월 20달러)로 올리거나 상업 이용이 가능한 Cloudflare로 옮긴다.

## SNS 미디어 (Buffer 게시용)
Buffer는 공개 URL의 미디어만 받는다. 카드뉴스 이미지·영상은 이 사이트의 `/sns/<날짜>/`에 올려 쓴다.
1. `scripts/sns-add.sh 2026-11-25 card1.png card2.png reel.mp4` → 작업 브랜치에 커밋·푸시, 공개 URL 출력
2. Vercel 운영 배포: create_deployment(project `prj_dEpPd1xw5T2DWTFoHQyJmnGkM8Mf`, team `team_Bg0llToWzvrZxR5uDDwTkqhm`, target `production`, gitSource github phhs2024196-oss/nonsulera, ref `claude/project-thread-rc0tw4`)
3. URL이 200으로 열리는지 확인한 뒤 Buffer에 그 URL로 등록
- 파일명 영문·숫자·하이픈, 파일당 95MB 미만. 검색엔진 노출은 robots로 막음(저장소가 공개라 파일 자체는 공개).

## 개발 규칙
- **관리자 동시 추가(대표 상시 규칙, 2026-11-24)**: 본 사이트에 기능을 추가하면, 그 기능의 관리 화면(통계·목록·설정)을 `/admin`에도 같은 커밋에서 추가한다. 필요한 집계는 `admin_stats()`(supabase/migrations)에 키를 더해 받는다.
- 새 행동 기록 종류는 `log_event()`의 허용 목록과 `lib/track.ts`의 `EventType`에 함께 추가한다.
- DB 변경은 `supabase/migrations/000N_*.sql` 파일로 남긴다(적용은 Supabase MCP 또는 SQL Editor).
- 관리자 페이지(`/admin`)는 `profiles.is_admin = true` 계정만 열린다(함수가 거부하면 404).
