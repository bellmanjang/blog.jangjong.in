# `@bellmanjang/eslint-fsd-next-app`

공식 예제 레이아웃과 정확히 일치하지 않는 프로젝트에서도, 실용적인 Feature-Sliced Design import 스타일을 강제하기 위한 ESLint 플러그인입니다.

이 플러그인은 처음에 아래 4가지 요구사항에서 출발했습니다.

1. 같은 slice 내부에서는 slice public API barrel이 아니라 실제 상대경로를 사용한다.
2. 서로 다른 slice 사이에서는 public API만 사용한다. deep import와 상대경로 import는 허용하지 않는다.
3. 각 slice는 public API 파일을 반드시 노출해야 한다.
4. autofix는 안전해야 한다. 실제 경로가 resolve될 때만 rewrite한다.

현재 구현은 여기에 더해 다음을 지원합니다.

- `app`, `shared`를 special segment layer로 처리
- `tsconfig.json` alias 추론
- 여러 alias가 있을 때 canonical import 스타일 선택
- ESLint `settings`를 통한 공용 설정
- slice root와 shared segment root 레이아웃 검사

## 이 플러그인이 다루는 범위

이 플러그인은 FSD 유사 구조 안에서 다음을 다룹니다.

- 같은 slice 내부 상대경로 import
- 서로 다른 slice 사이의 public API import
- `app`, `shared` segment layer 처리
- public API 존재 여부
- alias 정규화
- slice root 및 shared segment root 파일 배치

반대로 아래와 같은 full layer dependency direction 규칙은 다루지 않습니다.

- `widgets -> features/entities/shared only`
- `features -> entities/shared only`

이 부분은 의도적으로 범위 밖입니다. layer dependency 규칙은 `eslint-plugin-boundaries` 같은 다른 도구로 처리하는 것을 권장합니다.

## 빠른 시작

공용 플러그인 설정은 ESLint `settings`를 통해 넣습니다.

```js
import fsd from "@bellmanjang/eslint-fsd-next-app";

export default [
  {
    plugins: { fsd },
    settings: {
      "fsd-root": "src",
    },
    rules: {
      "fsd/exports-imports": "error",
      "fsd/no-slice-root-code-files": "error",
      "fsd/prefer-alias-imports": "error",
    },
  },
];
```

`src/app`을 Next.js App Router 루트로 쓰고, FSD slice layer를 `widgets`부터 시작하는 구조라면 이렇게 설정하면 됩니다.

```js
export default [
  {
    plugins: { fsd },
    settings: {
      "fsd-root": "src",
      "fsd-slice-layers": ["widgets", "features", "entities"],
      "fsd-segment-layers": ["app", "shared"],
      "fsd-public-api-required-segment-layers": ["shared"],
    },
    rules: {
      "fsd/exports-imports": "error",
      "fsd/no-slice-root-code-files": "error",
      "fsd/prefer-alias-imports": "error",
    },
  },
];
```

public API 파일이 `index.ts`가 아니라면 명시적으로 지정할 수 있습니다.

```js
export default [
  {
    plugins: { fsd },
    settings: {
      "fsd-public-api-files": ["public.ts"],
    },
    rules: {
      "fsd/exports-imports": "error",
      "fsd/no-slice-root-code-files": "error",
    },
  },
];
```

## Mental Model

### Slice layer

기본적으로 아래 layer는 일반적인 FSD slice layer로 간주합니다.

- `pages`
- `widgets`
- `features`
- `entities`

boundary 단위는 다음과 같습니다.

- `src/<layer>/<slice>`

예시:

- `src/pages/post`
- `src/widgets/post-list`
- `src/features/post-toc`
- `src/entities/post`

### Segment layer

기본적으로 아래 layer는 special segment layer로 간주합니다.

- `app`
- `shared`

boundary 단위는 다음과 같습니다.

- `src/<layer>/<segment>`

예시:

- `src/shared/lib`
- `src/shared/markdown`
- `src/app/providers`

`app`과 `shared`는 “하나의 큰 slice를 segment로 나눈 형태”로 취급합니다.

즉:

- 같은 `app` layer 내부 import는 허용됩니다.
- 같은 `shared` layer 내부 import는 허용됩니다.
- 다만 같은 boundary 내부 import 스타일은 상대경로로 정규화됩니다.

중요한 차이:

- 기본값 기준으로 `app`은 public API 파일이 필수가 아닙니다.
- 기본값 기준으로 `shared` segment는 boundary 외부에서 소비될 때 public API 파일이 필요합니다.
- public API가 필요한 segment layer의 root에는 public API 파일만 두는 것을 전제로 합니다.

### Non-boundary 파일

FSD root 안에 있지만, 인식되는 slice/segment boundary에는 속하지 않는 파일은 sliced target을 소비하는 외부 consumer로 취급합니다.

예시:

- `src/app/layout.tsx`

이런 파일이 `shared/lib`, `features/post`, `entities/post`를 import할 때는 해당 boundary의 public API를 사용해야 합니다.

## Rule 개요

이 플러그인은 3개의 rule을 제공합니다.

- `fsd/exports-imports`
  같은 boundary 내부 상대경로 규칙, boundary 간 public API import, missing public API 진단을 담당합니다.
- `fsd/no-slice-root-code-files`
  slice root와 public API가 필요한 segment root 바로 아래에 구현 파일이 놓이는 것을 막습니다.
- `fsd/prefer-alias-imports`
  `src/...` 같은 프로젝트 루트 기준 import를 alias import로 정규화합니다.

## Rule: `fsd/exports-imports`

메인 rule입니다.

### 강제하는 규칙

#### 1. 같은 slice 내부 import는 상대경로여야 함

같은 slice 내부에서 slice barrel을 통해 import하면 에러를 냅니다.

```ts
// src/features/posts/ui/PostCard.ts
import { usePost } from "@/features/posts";
```

는 아래처럼 바뀝니다.

```ts
import { usePost } from "../model/use-post";
```

rule은 barrel re-export를 분석해서, 안전할 때 실제 모듈 경로까지 추적합니다.

#### 2. 다른 slice import는 public API만 사용해야 함

허용되지 않는 예:

```ts
import { getPost } from "../api/post-api";
import { getPost } from "@/features/posts/api/post-api";
```

허용되는 예:

```ts
import { getPost } from "@/features/posts";
```

#### 3. 필요한 public API 파일은 반드시 존재해야 함

slice 또는 public API가 필요한 segment에 public API 파일이 없으면 에러를 냅니다.

예시:

- `src/features/posts/index.ts`
- `src/entities/post/index.ts`
- `src/shared/lib/index.ts`

기본값 기준으로 `app`은 `"fsd-public-api-required-segment-layers"`에 포함되지 않으므로 이 요구사항에서 제외됩니다.

#### 4. 같은 boundary 내부 import는 상대경로여야 함

같은 boundary 내부에서 alias import를 쓰면 상대경로로 고칩니다.

적용 대상:

- 같은 slice
- 같은 `shared` layer
- 같은 `app` layer
- `.css`, `.scss` 같은 같은 boundary asset import

```ts
import "@/app/_styles/global.scss";
```

이 `src/app/layout.tsx` 안에 있다면 아래처럼 바뀝니다.

```ts
import "./_styles/global.scss";
```

### Rule이 사용하는 public API 개념

이 rule은 다음 두 가지를 구분합니다.

- slice public API
- segment public API

예시:

- `@/features/posts`
- `@/entities/post`
- `@/shared/lib`
- `@/shared/ui`

### Safe autofix 정책

rewrite 결과가 안전하게 resolve될 때만 autofix를 적용합니다.

현재 safe fix가 가능한 경우:

- boundary 간 상대경로 import -> preferred alias public API
- boundary 간 deep alias import -> preferred alias public API
- 같은 boundary 내부 alias import -> 상대경로 import
- 같은 slice barrel import -> 모든 binding이 하나의 실제 파일로 resolve될 때 relative deep import

의도적으로 no-fix로 남기는 경우:

- target public API가 존재하지 않는 경우
- rewrite한 경로가 resolve되지 않는 경우
- 같은 slice barrel import를 여러 파일 import로 쪼개야 하는 경우
- 같은 slice barrel의 namespace import

여러 파일로 쪼개는 경우는 모듈 평가 순서를 바꿀 수 있으므로 의도적으로 report-only로 남겨둡니다.

## Rule: `fsd/no-slice-root-code-files`

이 rule은 boundary root 레이아웃을 강제합니다.

- 구현 파일은 `ui`, `model`, `lib`, `api` 같은 segment 아래에 둬야 합니다.
- slice root에는 public API만 있어야 합니다.
- public API가 필요한 segment layer의 root에도 public API만 있어야 합니다.

예시:

- 허용: `src/features/post/index.ts`
- 금지: `src/features/post/types.ts`
- 허용: `src/shared/lib/index.ts`
- 금지: `src/shared/lib/date.ts`

기본 동작:

- slice root에 적용됩니다.
- `shared/lib`처럼 public API가 필요한 segment root에도 적용됩니다.
- 기본값 기준으로 `app`은 `"fsd-public-api-required-segment-layers"`에 포함되지 않으므로 적용하지 않습니다.

허용되는 public API 파일은 `"fsd-public-api-files"`로 제어합니다.

기본 public API 파일:

- `index.ts`
- `index.tsx`
- `index.js`
- `index.jsx`
- `index.mts`
- `index.cts`
- `index.mjs`
- `index.cjs`

## Rule: `fsd/prefer-alias-imports`

이 rule은 `src/...` 같은 프로젝트 루트 기준 import를 alias import로 바꿉니다.

```ts
import { cx } from "src/shared/lib/class";
export { Markdown } from "src/shared/markdown";
const mod = import("src/shared/ui/layout/Navbar");
```

는 다음처럼 바뀔 수 있습니다.

```ts
import { cx } from "@shared/lib/class";
export { Markdown } from "@shared/markdown";
const mod = import("@shared/ui/layout/Navbar");
```

alias 경로가 실제로 같은 파일을 가리킬 때만 fix를 적용합니다.

## Shared Settings Reference

공용 설정은 모두 prefixed ESLint `settings` key를 통해 넣습니다.

현재는 rule-specific option이 없습니다.

우선순위:

1. prefixed `settings`
2. plugin default

### `"fsd-root"?: string`

FSD root 디렉터리를 명시합니다.

예시:

- `"src"`
- `"/abs/path/to/src"`

생략하면 `tsconfig.json`의 path alias를 기반으로 추론합니다.

### `"fsd-tsconfig-path"?: string`

alias 추론에 사용할 `tsconfig.json` 경로를 명시합니다.

생략하면 lint 대상 파일에서 가장 가까운 `tsconfig.json`을 찾고, 없으면 `<projectRoot>/tsconfig.json`을 사용합니다.

### `"fsd-alias-preference"?: "root" | "most-specific"`

어떤 alias 스타일을 canonical로 볼지 정합니다.

기본값:

```ts
"most-specific"
```

의미:

- `@/* -> src/*` 와 `@shared/* -> src/shared/*` 가 동시에 있을 때
- `src/shared/*` import는 `@shared/*`를 선호합니다.

루트 alias 하나로 통일하고 싶다면:

```ts
"fsd-alias-preference": "root"
```

rule 판정과 fixer는 같은 alias 선택 로직을 사용합니다. 즉 non-preferred alias 스타일은 preferred 스타일로 자동 수정될 수 있습니다.

### `"fsd-exts"?: string[]`

경로 resolve와 public API 탐지에 사용할 코드 확장자 목록입니다.

기본값:

```ts
[
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
]
```

### `"fsd-slice-layers"?: string[]`

일반 slice layer로 취급할 layer 목록입니다.

기본값:

```ts
["pages", "widgets", "features", "entities"]
```

### `"fsd-segment-layers"?: string[]`

special segment layer로 취급할 layer 목록입니다.

기본값:

```ts
["app", "shared"]
```

### `"fsd-public-api-required-segment-layers"?: string[]`

public API 파일을 반드시 노출해야 하는 segment layer 목록입니다.

기본값:

```ts
["shared"]
```

의미:

- slice layer는 항상 public API 파일이 필요합니다.
- segment layer는 여기에 포함된 경우에만 public API 파일이 필요합니다.
- 기본값에서는 `shared`만 public API를 요구하고, `app`은 요구하지 않습니다.

### `"fsd-public-api-files"?: string[]`

`fsd/exports-imports`와 `fsd/no-slice-root-code-files`가 공유하는 설정입니다.

어떤 파일을 boundary public API endpoint로 볼지 지정합니다.

예시:

- 기본값: `index.ts`, `index.tsx`, `index.js`, ...
- 커스텀: `public.ts`

`"fsd-public-api-files": ["public.ts"]`로 설정하면:

- `fsd/no-slice-root-code-files`는 `src/features/post/public.ts`를 허용합니다.
- `fsd/exports-imports`는 `@/features/post/public`을 slice public API로 인정합니다.

## Alias Inference

이 플러그인은 `tsconfig.json`의 `compilerOptions.paths`를 읽습니다.

지원하는 형태:

- 주석
- trailing comma
- `extends` 체인

파싱은 plain `JSON.parse`가 아니라 TypeScript config API를 사용합니다.

alias를 사용할 수 있을 때 플러그인은 다음 순서로 동작합니다.

1. 모든 alias mapping을 수집한다.
2. 그중에서 가장 가능성 높은 FSD root를 추론한다.
3. 추론된 root 또는 명시된 root 안에 들어오는 alias만 유지한다.
4. `"fsd-alias-preference"`에 따라 canonical alias를 고른다.

`fsd/exports-imports`와 `fsd/prefer-alias-imports`는 effective FSD root 안으로 resolve되는 alias mapping이 최소 하나는 있어야 합니다. root가 명시적이든 추론이든 상관없이, 그런 alias가 하나도 없으면 두 rule은 조용히 비활성화되지 않고 invalid configuration 에러를 보고합니다.

### 여러 path alias가 동시에 있는 경우

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

여러 `paths` alias가 같은 target을 가리킬 수 있다면, 기본 alias preference는 가장 구체적인 alias로 import를 정규화합니다.

```ts
import { cx } from "@shared/lib";
```

아래처럼 두지 않습니다.

```ts
import { cx } from "@/shared/lib";
```

## FSD 문서와의 관계

이 플러그인은 FSD의 의도를 따르되, 실제 프로젝트에 맞게 해석을 보완한 구현입니다.

주요 해석 기준:

- `pages`, `widgets`, `features`, `entities`는 slice layer
- `app`, `shared`는 segment layer
- `app`, `shared` 내부에서는 relative import 허용
- 기본값 기준으로 `shared` segment는 boundary 외부 소비를 위한 public API가 필요
- 기본값 기준으로 `app`은 `index.ts(x)` public API를 요구하지 않음

이 해석은 아래 같은 Next.js 중심 구조에 맞춰져 있습니다.

```txt
src/
├─ app/
├─ widgets/
├─ features/
├─ entities/
└─ shared/
```

## Known Limitations

- 이 패키지는 layer dependency direction 자체는 강제하지 않습니다.
- 여러 파일로 쪼개야 하는 same-slice barrel import는 보고만 하고 autofix하지 않습니다.
- same-slice barrel의 namespace import는 보고만 하고 autofix하지 않습니다.
- public API 존재 여부는 설정된 코드 확장자 기준으로 판단합니다.
- non-code asset은 public API로 보지 않지만, 같은 boundary 안에서 alias로 import하면 상대경로로 정규화합니다.

## 테스트 커버리지 요약

현재 테스트는 다음을 커버합니다.

- 같은 slice barrel -> relative deep import
- boundary 간 상대경로 -> public API
- missing public API reporting
- JavaScript public API 파일
- `tsconfig` root/alias 추론
- 여러 alias mapping
- `"fsd-alias-preference": "root"` 와 `"most-specific"`
- 같은 boundary asset import
- alias가 없을 때 명시적 `"fsd-root"` invalid config
- public API reporting cache invalidation
- same-slice barrel analysis cache invalidation
- `fsd/prefer-alias-imports` cache invalidation
- unsafe multi-file same-slice barrel split의 no-fix 동작

## 로컬 개발

패키지 스크립트:

```bash
bun run --filter @bellmanjang/eslint-fsd-next-app build
bun run --filter @bellmanjang/eslint-fsd-next-app test
```

이 패키지는 TypeScript config parser와 AST 유틸을 사용하므로 런타임 dependency로 `typescript`에 의존합니다.

## 구현 구조

```txt
src/
├─ core/
│  ├─ alias-utils.ts
│  ├─ config.ts
│  ├─ constants.ts
│  ├─ import-utils.ts
│  ├─ path-utils.ts
│  ├─ public-api-utils.ts
│  ├─ shared-settings.ts
│  └─ types.ts
├─ rules/
│  ├─ exports-imports/
│  │  ├─ export-map.ts
│  │  ├─ path-utils.ts
│  │  ├─ resolution.ts
│  │  ├─ rule.ts
│  │  ├─ same-slice-public-api-fix.ts
│  │  └─ types.ts
│  ├─ exports-imports.ts
│  ├─ no-slice-root-code-files.ts
│  └─ prefer-alias-imports.ts
└─ test/
   ├─ helpers.ts
   ├─ exports-imports/
   │  ├─ boundary-enforcement.test.ts
   │  ├─ config-and-cache.test.ts
   │  ├─ helpers.ts
   │  └─ same-boundary.test.ts
   ├─ no-slice-root-code-files/
   │  ├─ helpers.ts
   │  └─ rule.test.ts
   └─ prefer-alias-imports/
      ├─ cache.test.ts
      ├─ helpers.ts
      └─ rewrite.test.ts
```
