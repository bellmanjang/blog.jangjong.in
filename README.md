# Jang Jong-in's Blog

Next.js App Router 기반 개인 블로그입니다.

포스트는 `_posts/*.md`로 관리하고, 블로그 기능 구현 과정은 글로 남깁니다.  
긴 제작기는 [_posts/집-짓는-중입니다.md](_posts/집-짓는-중입니다.md)에 정리되어 있습니다.

## Tech Stack

- Runtime / package manager: `Bun`
- Framework: `Next.js App Router`
- UI: `Radix UI`, `Tailwind CSS`
- Markdown: `react-markdown`, `unified`, `remark/rehype` plugins
- Search: `MiniSearch` + build-time index
- Storage: `Neon PostgreSQL`
- Deploy: `Vercel`

## Features

- Markdown 기반 포스트
- 동적 Open Graph 이미지
- JSON-LD 메타데이터
- 커스텀 Markdown 렌더러
- KaTeX, Mermaid, Sandpack live code block
- TOC 사이드바와 활성 경로 표시
- 한글/영문 검색
- 블로그 방문자 수와 포스트 조회수
- 포스트 댓글과 1단계 답글

## Project Structure

```text
src/
  app/        Next.js routes, layouts, route handlers
  widgets/    page-level UI blocks
  features/   user-facing feature modules
  entities/   domain entities such as post
  shared/     shared UI, markdown, browser, lib code
_posts/       markdown posts and build-time search index
scripts/      build/setup scripts
packages/     local workspace packages
tests/e2e/    Playwright smoke tests
```

이 프로젝트는 FSD에 가까운 경계 규칙을 사용합니다.  
import 규칙은 `eslint-plugin-boundaries`와 로컬 패키지 `@bellmanjang/eslint-fsd-next-app`으로 검사합니다.

## Getting Started

```bash
bun install
bun run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

프로덕션 빌드:

```bash
bun run build
bun run start
```

## Environment Variables

`.env.example`을 참고해서 `.env.local`을 만듭니다.

```env
BASE_URL="https://blog.jangjong.in"
DATABASE_URL="postgres://USER:PASSWORD@EP-XXXX.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
ANALYTICS_SALT="replace-with-a-long-random-secret"
# ANALYTICS_WRITE_IN_DEV="1"
```

- `BASE_URL`: canonical URL과 OG 이미지 URL 생성에 사용합니다.
- `DATABASE_URL`: Neon PostgreSQL 연결 문자열입니다.
- `ANALYTICS_SALT`: 방문자/댓글 작성자 식별값을 해시할 때 사용합니다.
- `ANALYTICS_WRITE_IN_DEV`: 로컬 개발 환경에서 방문자/조회수 write를 허용하려면 `1`로 설정합니다.

댓글 UI는 개발 모드에서 mock 데이터를 사용합니다.  
실제 댓글 저장/조회는 production/test 빌드의 API 경로에서 Neon을 사용합니다.

## Storage Setup

방문자 수, 조회수, 댓글은 Neon PostgreSQL에 저장합니다.

Neon SQL editor에서 아래 스크립트를 실행합니다.

```bash
scripts/setup-neon-analytics.sql
```

생성되는 주요 테이블:

- `blog_visitors`
- `blog_daily_visitors`
- `post_total_views`
- `post_comments`

## Scripts

- `bun run dev`: Next.js 개발 서버 실행
- `bun run build`: 프로덕션 빌드와 검색 인덱스 생성
- `bun run start`: 빌드 결과 실행
- `bun run test`: `src` 아래 unit test 실행
- `bun run lint`: ESLint와 Biome 검사
- `bun run validate`: 로컬 ESLint 패키지 test/build와 앱 lint 실행
- `bun run test:e2e`: 빌드 후 Playwright smoke test 실행
- `bun run test:all`: 전체 검증 게이트

## Writing Posts

포스트는 `_posts/*.md`에 작성합니다.

Frontmatter 예시:

```yaml
---
title: "집 짓는 중..."
summary: "포스트 요약"
publishedAt: "2026-02-09T21:00:00+09:00"
lastModifiedAt: "2026-05-09T22:54:51+09:00"
highlighted: true
---
```

빌드 시 `scripts/build-search-index.ts`가 `_posts/_index.json`을 생성합니다.

## Testing

일반적인 작업 검증:

```bash
bun run test
bun run lint
bun run build
```

사용자 흐름에 영향을 주는 변경은 E2E까지 확인합니다.

```bash
bun run test:e2e
```

CI에서는 `bun run test:all`을 실행합니다.

## Deployment

배포는 Vercel Git integration이 담당합니다.

- PR: GitHub Actions CI와 Vercel Preview Deployment 실행
- `main` 머지: Vercel Production Deployment 실행
- Vercel build command: `bun run build`

자세한 작업 루틴은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고합니다.
