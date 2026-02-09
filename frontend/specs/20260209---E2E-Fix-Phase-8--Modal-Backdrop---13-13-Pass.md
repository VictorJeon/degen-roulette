# E2E Fix Phase 8: Modal Backdrop + 13/13 Pass

## 목표
Provably Fair 테스트 3개 수정 → 전체 13/13 pass

## 현재 상태
- 10/13 pass (Phase 7)
- 실패 3개: 모두 `tests/e2e/provably-fair.spec.ts`
  - "should display server seed after game completion"
  - "should show consistent seed hash before and after game"  
  - "should explain provably fair system to users"

## 실패 원인
Modal backdrop이 버튼 클릭을 가로막는 UI 레이어 문제.
- Provably Fair 모달이 열리는데 backdrop/overlay가 클릭을 intercept
- 또는 모달 내부 요소가 z-index 문제로 클릭 불가

## 수정 방법

### 1. 모달 backdrop 이슈 확인 및 수정
- `components/` 에서 modal 관련 컴포넌트 찾기
- backdrop/overlay의 z-index, pointer-events 확인
- 모달 내부 버튼이 클릭 가능하도록 수정

### 2. 테스트 코드 보강
- `fairButton.click()` 전에 backdrop 닫기 또는 `{ force: true }` 사용
- 모달 열릴 때 적절한 wait 추가

### 3. 테스트에서 모달 클릭 시 page.locator().click({ position: ... }) 활용

## 검증
```bash
cd ~/projects/frontend
pnpm exec playwright test tests/e2e/ --reporter=list 2>&1 | tail -30
```

전체 13개 테스트 ALL PASS 필요.

## 제약
- game-mock.ts (in-memory) 사용 — DB 없음
- POSTGRES_URL 환경변수 없이 실행
- TestWalletAdapter + window.solana 패턴 유지
- 프로덕션 로직 변경 최소화 (CSS/z-index 수정은 OK)

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
