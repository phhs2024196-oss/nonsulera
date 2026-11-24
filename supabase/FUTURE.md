# 확장 설계 (아직 만들지 않음)

같은 사이트·같은 Supabase 프로젝트에 테이블만 추가한다. 회원(profiles)과 행동 기록(events)은 그대로 쓴다.

## 답안 채점 (AI 첨삭)
- `problems` (id, school, year, no, body, rubric jsonb) — 기출·모의 문항과 채점 기준
- `submissions` (id, user_id, problem_id, image_paths text[], status, created_at) — 답안 사진은 Storage 버킷 `answers/{user_id}/` (본인만 읽기 RLS)
- `gradings` (submission_id, score, rubric_scores jsonb, feedback, grader: ai|human, model, created_at)
- 흐름: 업로드 → 서버 함수가 Claude API로 채점 → 결과 저장 → /me/answers 에서 조회
- 기준(독립 평가 결론): 사람 채점과 일치율 90% 이상 확인 전까지 무료 베타

## 교재 판매
- `products` (key, title, kind, price, file_path) / `orders` (id, user_id, product_key, amount, pg_tid, status)
- 결제: 토스페이먼츠 또는 포트원(사업자 등록 후)
- PDF는 구매자별 워터마크(이름·주문번호) 생성 후 서명 URL로 내려받기 → events.type = 'purchase_download'
