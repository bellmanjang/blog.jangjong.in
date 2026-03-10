# Contributing

이 문서는 이 프로젝트의 작업 루틴과 배포 파이프라인을 정리한 가이드입니다.

## 환경

- 패키지 매니저와 실행 런타임은 `bun`을 사용합니다.
- 로컬 Node.js 버전은 [`.nvmrc`](/Users/joey/Henge/github/repo/blog.jangjong.in/.nvmrc) 기준으로 맞춥니다.
- 의존성 설치:

```bash
bun install
```

## 주요 스크립트

- `bun run dev`
  - Next.js 개발 서버를 실행합니다.
- `bun run validate`
  - `@bellmanjang/eslint-fsd-next-app` 패키지의 `test 및 build`
  - 앱 전체 `eslint`
  - 앱 전체 `biome`
- `bun run test`
  - `src` 아래 앱 unit test를 실행합니다.
- `bun run test:e2e`
  - `bun run build` 후 Playwright smoke test를 실행합니다.
- `bun run test:all`
  - `validate + test + test:e2e` 전체 게이트입니다.
- `bun run build`
  - Next.js production build를 실행합니다.
  - `postbuild` lifecycle로 검색 인덱스 생성 스크립트도 함께 실행됩니다.
- `bun run start`
  - production build 결과를 로컬에서 실행합니다.

## 개발 루틴

일반적인 로컬 작업 순서는 아래를 권장합니다.

1. `main`에서 기능 브랜치를 만듭니다.
2. 개발 중에는 `bun run dev`로 화면을 보면서 작업합니다.
3. 순수 로직만 바꿨다면 필요할 때 `bun run test`를 실행합니다.
4. PR 올리기 전에는 최소 `bun run validate`를 실행합니다.
5. 라우팅, 검색, 포스트 렌더링, 배포 동작처럼 실제 사용자 흐름에 영향이 있으면 `bun run test:all`까지 실행합니다.

추천 기준:

- 빠른 개발 확인: `bun run dev`
- 일반 사전 검증: `bun run validate`
- 최종 머지 전 검증: `bun run test:all`

## 테스트 정책

- 앱 순수 로직 테스트는 `src/**` 아래 코드 가까이에 `*.test.ts`로 둡니다.
- 앱 전체 사용자 흐름 smoke test는 `tests/e2e` 아래에서 Playwright로 관리합니다.
- 워크스페이스 패키지 테스트는 각 패키지 내부에서 관리합니다.

현재 테스트 계층은 아래처럼 나뉩니다.

- Unit: `bun run test`
- Static checks: `bun run validate`
- E2E smoke: `bun run test:e2e`
- Full gate: `bun run test:all`

## PR 워크플로우

브랜치에서 `main`으로 PR을 열면 두 가지가 동작합니다.

1. GitHub Actions CI
   - 워크플로우 파일: `.github/workflows/ci.yml`
   - 실행 내용: `bun install --frozen-lockfile`, Playwright browser 설치, `bun run test:all`
2. Vercel Preview Deployment
   - GitHub과 연결된 Vercel Git integration이 PR 브랜치를 기준으로 Preview를 생성합니다.

PR 머지 전 체크 기준은 아래를 권장합니다.

- GitHub Actions CI 성공
- Vercel Preview에서 실제 화면과 핵심 동작 확인
- 리뷰 승인 완료

## main 배포 파이프라인

이 프로젝트는 GitHub Actions가 배포를 하지 않습니다.
배포는 Vercel Git integration이 담당합니다.

동작 순서는 아래와 같습니다.

1. PR이 `main`에 머지됩니다.
2. `main` push를 기준으로 GitHub Actions CI가 다시 실행됩니다.
3. 동시에 Vercel이 `main`을 기준으로 Production Deployment를 시작합니다.
4. Vercel은 `vercel.json`의 설정에 따라 `bun run build`를 실행합니다.
5. `bun run build`는 Next.js production build 후 `postbuild`에서 검색 인덱스를 생성합니다.
6. 빌드가 성공하면 Production에 반영됩니다.

중요한 점:

- `main` 머지 이후 Vercel 배포는 자동입니다.
- 따라서 직접 `main`에 푸시하지 말고, 반드시 PR + required checks 흐름으로 운영하는 것이 좋습니다.

## 브랜치 보호 권장 사항

GitHub에서 `main` 브랜치에 아래 규칙을 거는 것을 권장합니다.

- Require a pull request before merging
- Require approvals
- Require status checks to pass before merging
- GitHub Actions CI와 Vercel Preview 확인 후 머지
