# Fix E2E Playwright Tests

## 현재 상태
- 11개 테스트 전부 실패
- 에러: `page.goto: net::ERR_ABORTED` (dev 서버 시작 전 테스트 실행)
- `webServer.timeout: 120000` 추가됨 (이걸로 해결될 수도 있음)

## 프로젝트
- 경로: `/Users/nova/projects/degen-roulette/frontend/`
- Playwright 설정: `playwright.config.ts`
- 테스트 파일: `tests/e2e/*.spec.ts`
- Test Mode: `?testMode=true` 쿼리 파라미터로 테스트 지갑 주입

## 작업
1. `npx playwright test --reporter=line` 실행
2. 실패하는 테스트 분석
3. 에러 원인 수정 (테스트 코드 또는 앱 코드)
4. 전체 테스트 통과할 때까지 반복
5. 결과 요약 보고

## 테스트 모드 구조
- `?testMode=true` → `TestModeProvider`가 테스트 키페어 지갑 주입
- 테스트 키페어: `playwright/fixtures/test-keypair.json`
- 테스트 지갑 주소: `7sGVDuAUW8g4noZggELMgQrpLQbTeARfpViVWrT7WRbW`
- 실제 devnet 트랜잭션 실행

## UI 셀렉터
- 베팅 시작: `.trigger-btn.trigger-btn-start`
- 게임 안내: `.game-instruction`
- 퀵 베팅: `.quick-btn-inline`

## 주의사항
- dev 서버 올라올 때까지 충분히 대기 (timeout 120s)
- `testMode=true` 쿼리 파라미터 필수
- devnet RPC 불안정할 수 있으니 retry 로직 고려

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
