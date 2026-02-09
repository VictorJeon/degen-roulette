# TESTING.md — frontend

## 테스트 환경

- **Unit/Integration**: {Vitest/Jest/기타}
- **E2E**: {Playwright/Cypress/기타}
- **기타**: {온체인 테스트, 성능 테스트 등}

## 테스트 스크립트

| 명령 | 설명 |
|------|------|
| `npm run test` | 전체 테스트 실행 |
| `npm run test:unit` | Unit 테스트만 |
| `npm run test:integration` | Integration 테스트만 |
| `npm run test:e2e` | E2E 테스트만 |
| `npm run test:pre-push` | Git push 전 빠른 검증 (critical path만) |

## 테스트 시나리오

### Happy Path
1. {주요 기능 1 정상 동작}
2. {주요 기능 2 정상 동작}
3. {통합 시나리오}

### Edge Cases
- {엣지 케이스 1}
- {엣지 케이스 2}
- {에러 처리 시나리오}

### Performance
- {성능 요구사항 — 예: API 응답 < 200ms}
- {부하 테스트 — 예: 100 RPS 처리}

## Git Hook

- **pre-push**: `npm run test:pre-push`
  - Critical path 테스트만 실행 (전체 테스트는 CI에서)
  - 실패 시 push 차단

## CI/CD

- **GitHub Actions**: `.github/workflows/test.yml`
- **트리거**: Pull Request, Push to main
- **단계**:
  1. Unit tests
  2. Integration tests
  3. E2E tests (병렬 실행)
  4. Coverage report

## 로컬 테스트 가이드

### 처음 설정
```bash
npm install
npm run test:setup  # 필요시 (DB 마이그레이션, 환경 변수 등)
```

### 개발 중
```bash
npm run test:watch  # 파일 변경 감지 자동 재실행
```

### Push 전
```bash
npm run test:pre-push  # 빠른 검증
```

### 전체 검증
```bash
npm run test  # 모든 테스트
```

## 테스트 데이터

- **Fixtures**: `tests/fixtures/`
- **Mocks**: `tests/mocks/`
- **Test DB**: {테스트 DB 설정 — SQLite, Docker Postgres 등}

## 참고

- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- Testing Best Practices: https://github.com/goldbergyoni/javascript-testing-best-practices
