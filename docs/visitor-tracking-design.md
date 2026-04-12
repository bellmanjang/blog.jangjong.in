# Visitor Tracking Design

## Goal

이 블로그에서 다음 지표를 수집하고 노출한다.

- 총 블로그 방문자 수
- 일간 블로그 방문자 수
- 포스트별 총 조회 수

다음 조건을 함께 만족한다.

- 기존 정적 블로그 렌더링 구조를 최대한 유지한다.
- Vercel 배포 환경에서 무리 없이 동작한다.
- 개인 정보 수집을 최소화한다.
- 이후 "최근 7일 인기글", "월간 리포트" 같은 기능으로 확장 가능해야 한다.

## Current Architecture

현재 블로그는 다음 특성이 있다.

- Next.js App Router 기반이다.
- 포스트 본문은 `_posts/*.md` 에서 읽어 정적으로 렌더링한다.
- 포스트 상세 페이지는 `generateStaticParams()` 를 사용한다.
- 이미 `@vercel/analytics` 가 레이아웃에 연결되어 있다.

이 구조에서는 포스트 본문 페이지를 동적으로 바꾸지 않고, 방문 이벤트만 별도 API로 수집하는 방식이 가장 자연스럽다.

## Recommendation

추천안은 다음 조합이다.

- 렌더링: 현재처럼 정적 포스트 페이지 유지
- 수집:
  - 전역 방문은 클라이언트에서 `POST /api/analytics/visit`
  - 포스트 조회는 포스트 상세에서 `POST /api/analytics/view`
- 저장소: Neon Postgres
- 고유 방문 판정: 1st-party visitor cookie + 서버 측 해시
- 집계 단위: `Asia/Seoul` 기준 일 단위

이 방식을 추천하는 이유는 다음과 같다.

- 정적 렌더링 성능과 SEO를 유지할 수 있다.
- 개인 블로그 트래픽 규모에서는 SQL 기반 집계가 충분히 단순하다.
- 포스트별 조회 수, 기간별 랭킹, 참조 리포트를 SQL로 쉽게 뽑을 수 있다.
- Redis/KV 단독 설계보다 운영 데이터 조회와 백업이 쉽다.

## Metrics Definition

지표 이름을 먼저 고정한다.

### 1. Total Blog Visitors

블로그를 방문한 서로 다른 visitor id의 누적 수다.

- 같은 사용자가 다른 날 다시 와도 1명으로 유지한다.
- 다른 기기/브라우저는 다른 방문자로 계산될 수 있다.

### 2. Daily Blog Visitors

같은 날 블로그를 방문한 서로 다른 visitor id 수다.

- 기준 시간대는 `Asia/Seoul`
- 같은 사람이 하루에 여러 페이지를 봐도 1명으로 본다.

### 3. Post Total Views

조건을 만족하는 페이지 진입 이벤트 수다.

- 같은 사용자가 여러 번 들어오면 여러 번 증가할 수 있다.
- 새로고침도 별도 조회로 볼 수 있다.

## Privacy Policy

다음 원칙을 따른다.

- IP 주소 원문은 저장하지 않는다.
- 사용자 계정 기반 식별은 하지 않는다.
- 브라우저에 익명 `visitor_id` 쿠키를 발급한다.
- 서버에는 `visitor_id` 원문 대신 salt를 섞은 해시만 저장한다.
- `DNT: 1` 이면 이벤트를 저장하지 않는다.

이 설계는 "정확한 실사용자 추적"보다 "개인 블로그 운영 지표"에 초점을 둔다.

## Event Flow

### Blog Visit Tracking

1. 사용자가 블로그 내 페이지에 진입한다.
3. 문서가 `visible` 상태이고, 짧은 dwell time 을 넘기면 추적 요청을 보낸다.
4. 서버는 bot/prefetch/DNT 여부를 검사한다.
5. 서버는 `visitor_id` 쿠키를 읽고 없으면 새로 만든다.
6. 서버는 `visitor_hash = sha256(visitor_id + ANALYTICS_SALT)` 를 계산한다.
7. 서버는 전체 방문자 / 일간 방문자 테이블을 upsert 한다.
8. 응답으로 최신 요약 수치를 내려줄 수 있다.

### Post View Tracking

1. 사용자가 `/posts/[slug]` 페이지에 진입한다.
2. 포스트 상세 전용 클라이언트 컴포넌트가 조회 이벤트를 보낸다.
3. 서버는 bot/prefetch/DNT 여부를 검사한다.
4. 서버는 해당 slug의 총 조회 수를 증가시킨다.

### Suggested Trigger Rules

오탐을 줄이기 위해 아래 조건을 모두 만족할 때만 전송한다.

- 포스트 상세 페이지다.
- `document.visibilityState === "visible"`
- 진입 후 1초 이상 머물렀다.
- 현재 탭 세션에서 같은 slug를 아직 보내지 않았다.

클라이언트 세션 중복 방지는 `sessionStorage` 로 처리한다.

## Data Model

현재 요구 지표 기준으로는 "방문자 테이블 2개 + 포스트 조회수 테이블 1개"가 가장 단순하다.

### Table: `blog_visitors`

전체 블로그 고유 방문자를 저장한다.

Suggested columns:

- `visitor_hash` text primary key
- `first_visited_at` timestamptz not null

### Table: `blog_daily_visitors`

일간 블로그 방문자를 저장한다.

Suggested columns:

- `date_kr` date not null
- `visitor_hash` text not null
- `first_visited_at` timestamptz not null
- primary key `(date_kr, visitor_hash)`

### Table: `post_total_views`

포스트별 총 조회 수를 저장한다.

Suggested columns:

- `slug` text not null
- `total_views` integer not null default 0
- `last_viewed_at` timestamptz not null
- primary key `(slug)`

## API Design

### 1. `POST /api/analytics/view`

용도:

- 포스트 총 조회 수 증가

Request body:

```json
{
  "slug": "Next-js에-FSD-적용해보기-feat-ESLint-플러그인-제작",
  "path": "/posts/Next-js에-FSD-적용해보기-feat-ESLint-플러그인-제작"
}
```

Response example:

```json
{
  "ok": true,
  "stats": {
    "totalViews": 123
  }
}
```

Validation rules:

- slug가 실제 존재하는 포스트여야 한다.
- body 크기는 아주 작게 제한한다.
- bot/prefetch/DNT 요청은 저장하지 않는다.

### 2. `POST /api/analytics/visit`

용도:

- 블로그 전체 방문자 집계

Response example:

```json
{
  "ok": true,
  "stats": {
    "totalVisitors": 321,
    "dailyVisitors": 18
  }
}
```

### 3. `GET /api/analytics/posts/[slug]`

용도:

- 포스트 상세 화면에 현재 조회 수 표시

Response example:

```json
{
  "slug": "example-post",
  "totalViews": 123
}
```

## UI Integration Plan

정적 페이지를 유지하기 위해 카운트 노출도 클라이언트 보강 방식으로 넣는다.

### Post Detail

`src/app/posts/[slug]/page.tsx` 에서 아래 두 UI를 붙인다.

- `BlogVisitTracker`
- `PostViewCount`

권장 배치는 발행일 옆 또는 제목 아래 메타 영역이다.

## Suggested Code Placement

프로젝트 구조를 고려하면 아래 배치가 무난하다.

- `src/features/analytics/model/types.ts`
- `src/features/analytics/lib/browser/should-track.ts`
- `src/features/analytics/lib/server/track-post-view.ts`
- `src/features/analytics/ui/BlogVisitTracker.tsx`
- `src/features/analytics/ui/PostViewTracker.tsx`
- `src/features/analytics/ui/PostViewCount.tsx`
- `src/app/api/analytics/visit/route.ts`
- `src/app/api/analytics/view/route.ts`
- `src/app/api/analytics/posts/[slug]/route.ts`

환경 변수는 별도 파일로 관리한다.

- `ANALYTICS_SALT`
- `DATABASE_URL`
- 선택: `ANALYTICS_WRITE_IN_DEV=1`

## Rendering Strategy

포스트 페이지는 계속 정적으로 생성한다.

이 결정이 중요한 이유는 다음과 같다.

- 마크다운 포스트 렌더링 성능을 그대로 유지한다.
- 검색 엔진이 보는 본문 HTML이 안정적이다.
- 조회 수 때문에 전체 페이지를 `force-dynamic` 으로 바꿀 필요가 없다.

대신 조회 수 텍스트는 hydration 이후 API 응답으로 채운다.

예상 UX:

- 최초 렌더: `조회수 -`
- 로딩 후: `조회수 123`

## Bot and Noise Filtering

초기 구현에서 최소한 아래는 제외한다.

- `DNT: 1`
- 알려진 crawler user-agent
- prefetch 성격의 요청 헤더
- 잘못된 slug

추가로 고려할 수 있는 항목:

- 같은 slug에 대해 30분 이내 동일 브라우저 중복 전송 억제
- 개발 환경에서는 저장 비활성화
- preview deployment에서는 저장 비활성화

## Failure Strategy

분석 기능이 실패해도 본문 렌더링은 절대 깨지지 않아야 한다.

원칙:

- 추적 API 실패는 UI에 노출하지 않는다.
- 조회 수 API 실패 시 `조회수 -` 로 남긴다.
- DB 오류가 나도 포스트 페이지 응답은 정상이어야 한다.

## Rollout Plan

### Phase 1

블로그 방문자와 포스트 조회수를 함께 수집한다.

- `POST /api/analytics/visit`
- `POST /api/analytics/view`
- `GET /api/analytics/posts/[slug]`
- 제목 아래 조회 수 노출

## Why Not Make The Page Dynamic

포스트 상세 페이지를 매 요청마다 DB에서 조회 수와 함께 렌더링할 수도 있다.

하지만 현재 구조에서는 단점이 더 크다.

- 정적 블로그의 장점이 줄어든다.
- 조회 수 때문에 전체 페이지 캐시 전략이 복잡해진다.
- 본문과 무관한 데이터를 위해 SSR 비용이 생긴다.

따라서 "정적 본문 + 동적 메타 데이터 조각" 전략이 더 적합하다.

## Open Decisions

구현 전에 아래 두 항목만 확정하면 된다.

### 1. Storage Provider

이 저장소에서는 `Neon + @neondatabase/serverless` 로 진행한다.

- SQL 에디터에서 `scripts/setup-neon-analytics.sql` 실행
- Vercel 환경 변수에 `DATABASE_URL`, `ANALYTICS_SALT` 등록
- 로컬 테스트가 필요하면 `ANALYTICS_WRITE_IN_DEV=1` 추가

### 2. What To Show Publicly

공개 노출 후보:

- 총 조회 수만 노출
- 블로그 전체 방문자 수 별도 노출

## Implementation Notes For This Repository

이 저장소에서는 아래 점을 특별히 반영한다.

- 포스트 slug의 원본은 `_posts/*.md` 파일명이다.
- 포스트 존재 여부 검증은 기존 post API 유틸을 재사용할 수 있다.
- 레이아웃은 이미 전역 analytics를 포함하므로, 커스텀 집계는 포스트 상세에만 좁혀 시작하는 편이 좋다.
- `src/app/posts/[slug]/page.tsx` 의 메타 영역에 조회 수 UI를 붙이기 쉽다.

## Next Step

다음 구현 순서가 가장 안전하다.

1. DB 스키마 추가
2. `POST /api/analytics/view` 구현
3. 포스트 상세용 클라이언트 tracker 추가
4. 조회 수 읽기 API와 UI 추가
5. 테스트와 preview 환경 예외 처리 추가
