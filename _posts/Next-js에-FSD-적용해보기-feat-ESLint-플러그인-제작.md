---
title: "Next.js 프로젝트에 FSD 적용해보기 (feat. ESLint 플러그인 제작)"
summary: "블로그 프로젝트에 FSD를 적용해봤습니다. 다만 Next.js App Router에서는 공식 예시를 그대로 쓰기 어려운 부분이 있어서, 프로젝트에 맞게 규칙을 다시 해석했고 이를 강제하는 ESLint 플러그인도 직접 만들었습니다."
publishedAt: "2026-03-08T14:00:00+09:00"
lastModifiedAt: "2026-03-08T14:00:00+09:00"
---

> 블로그 구조를 정리하다 보니, 어디까지가 재사용 코드이고 어디부터는 도메인 코드인지 조금씩 흐려지고 있다는 느낌이 들었습니다.  
> 이참에 `FSD`를 한 번 제대로 적용해보기로 했어요. 그런데 막상 적용하려고 보니, 공식 문서를 그대로 따라가기엔 제 프로젝트 구조와 맞지 않는 부분이 있었습니다.  
> 그래서 제 프로젝트에 맞는 방식으로 규칙을 다시 정리했고, 사람이 일일이 지키기 힘든 부분은 `ESLint` 플러그인으로 강제하게 됐습니다.

# FSD 간단히 보기

`Feature-Sliced Design(FSD)`은 프론트엔드 애플리케이션의 코드를 `layer`, `slice`, `segment` 기준으로 나누는 아키텍처 방법론입니다.  
핵심은 “기능이 커져도 프로젝트를 이해하기 쉽게 만들고, 의존 방향을 좀 더 명확하게 유지하자”에 가깝습니다.

이런 구조를 떠올리면 됩니다.

```txt
src/
├─ app/
├─ pages/
├─ widgets/
├─ features/
├─ entities/
└─ shared/
```

처음 봤을 때는 그냥 폴더 정리 규칙처럼 보이는데, 실제로는 import 규칙이 훨씬 중요합니다.  
예를 들어 같은 layer의 다른 slice를 마음대로 참조하지 못하게 하거나, slice 바깥으로 노출할 공개 진입점(public API)을 분리하는 식이죠.

자세한 개념 설명은 제가 여기서 다시 풀어쓰기보다, 공식 문서를 보는 편이 훨씬 정확합니다.

- <a href="https://feature-sliced.design/docs/get-started/overview" target="_blank">Overview | Feature-Sliced Design</a>
- <a href="https://feature-sliced.design/docs/reference/layers" target="_blank">Layer | Feature-Sliced Design</a>
- <a href="https://feature-sliced.design/docs/reference/public-api" target="_blank">Public API | Feature-Sliced Design</a>

저는 이번에 “FSD를 완벽하게 공부하자”보다는, 지금 블로그 프로젝트에 적용 가능한 선에서 실제로 구조를 다듬는 쪽에 집중했습니다.

# 왜 적용하게 됐나

블로그를 다시 만들면서 Markdown 렌더링, TOC, 포스트 데이터 접근, 공용 UI, 브라우저 유틸 같은 것들이 하나둘씩 늘어났습니다.  
처음에는 규모가 작으니 그냥 적당히 나눠도 괜찮았는데, 시간이 지나니까 슬슬 이런 느낌이 오더라구요.

- 이 코드가 `feature`인지 `shared`인지 애매하다
- 페이지 조합 UI와 도메인 로직이 같은 폴더에 섞여 있다
- 공용으로 써도 되는 코드인지, 특정 화면 전용인지 이름만 봐서는 잘 안 보인다
- import 경로가 점점 제멋대로 된다

예를 들어 Markdown 관련 코드를 features에 둬야 할지 shared에 둬야 할지, 포스트 관련 UI를 widgets로 봐야 할지 features로 봐야 할지 애매한 순간이 생겼습니다.

특히 import 경로를 일관성 있게 작성하는 것이 제일 귀찮았습니다.  
어떤 파일은 `@/...`로 가져오고, 어떤 파일은 상대경로로 가져오고, 어떤 파일은 deep import를 하고 있으면 나중에 구조를 바꿀 때 정리 비용이 훨씬 커지더라구요.

결국 “폴더 구조만 FSD처럼 보이게 두는 것”보다, import 규칙까지 같이 강제하지 않으면 의미가 반쯤 사라진다고 느꼈습니다.

# Next.js App Router + FSD

## 공식 문서 예시

FSD 공식 문서에서 <a href="https://feature-sliced.design/docs/guides/tech/with-nextjs#app-router" target="_blank">Usage with Next.js - App Router</a> 예시를 보면  
루트에 `app/` 폴더를 두고, 실제 FSD 레이어는 `src/` 아래에 두는 식으로 설명합니다.

```txt
app/
├─ example/
│   └─ page.tsx
└─ api/

src/
├─ app/
├─ pages/
├─ widgets/
├─ features/
├─ entities/
└─ shared/
```

## 그대로 적용하기 어려웠던 점

이 방식은 구조적으로는 깔끔하지만, 제 프로젝트에서는 실제 작업 흐름이 다소 분리되는 불편함이 있었습니다.

결정적으로 `app/**/page.tsx`에서 `src/app/pages/**` 쪽 구현을 re-export하는 방식은 `Next.js`의 route 파일 제약과 잘 맞지 않았습니다.

예를 들면 route 파일에서는 페이지 컴포넌트 export 외에도 `dynamicParams`, `revalidate`, `metadata` 같은 것들을 다루는데, 이걸 re-export 기반으로 깔끔하게 유지하기가 애매했습니다.

실제로 `app/post/page.tsx`에서 아래처럼 page slice의 공개 진입점를 다시 re-export하는 식으로 가져가면:

```tsx
export { Page as default, metadata, dynamicParams } from "@/pages/post";
```

`Next.js`는 이런 에러를 냅니다.

> Next.js can't recognize the exported `dynamicParams` field in route.  
> It mustn't be reexported.

즉 이건 단순히 취향 차이의 문제가 아니라, route 파일이 직접 가져야 하는 export들이 실제로 존재한다는 뜻이었습니다.

## 내 프로젝트에서 택한 방식

그래서 저는 조금 다르게 가져갔습니다.

```txt
src/
├─ app/
├─ widgets/
├─ features/
├─ entities/
└─ shared/
```

여기서 `src/app`은 FSD의 `app layer`라기보다, 사실상 `Next.js App Router` 폴더입니다.  
대신 `widgets`, `features`, `entities`, `shared`는 FSD 레이어처럼 해석하고, `app`은 특수한 segment layer처럼 다루기로 했습니다.

이 지점부터는 “공식 문서를 그대로 따르는 것”보다 “공식 문서의 의도를 유지하면서, 내 구조에 맞게 해석하는 것”이 더 중요해졌습니다.

# 그래서 ESLint 플러그인을 만들었다

구조를 정리하다 보니, 사람이 리뷰로만 계속 잡기엔 번거로운 몇 가지 규칙들이 있었습니다.  
처음에는 아래 4가지만 맞추면 되겠다고 생각했습니다.

1. 같은 slice 내부에서는 반드시 상대경로를 쓴다.
2. 다른 slice로 갈 때는 반드시 공개 진입점를 쓴다.
3. 각 slice는 공개 진입점 파일을 가져야 한다.
4. autofix는 안전할 때만 한다.

요약하면, “같은 경계 안에서는 상대경로, 경계를 넘을 때는 공개 진입점”라는 기준을 자동으로 강제하고 싶었습니다.

여기서 한 가지가 더 있었습니다.  
같은 layer의 다른 slice를 import하는 <a href="https://feature-sliced.design/docs/guides/issues/cross-imports" target="_blank">cross-import</a>는 FSD에서 경계하는 패턴이어서, 이 역시 금지하고 싶었습니다.  

예를 들어 `features/comments`에서 `features/posts`를 가져오는 식의 cross-import는 공개 진입점를 쓰더라도 허용하지 않았고, 이 부분은 `eslint-plugin-boundaries`로 따로 막았습니다.

그래서 제가 만든 플러그인은 “허용된 의존 방향에서 import 스타일을 어떻게 강제할 것인가”에 더 집중하게 됐습니다.  
예를 들면 `widgets/post`에서 더 아래 layer인 `features/post-toc`를 가져올 때는 이런 규칙을 기대했습니다.

```ts
// ✅ 같은 slice 내부
import { usePost } from "../model/use-post";

// ✅ 허용된 의존 방향에서 공개 진입점 사용
import { TocSidebar } from "@/features/post-toc";

// ❌ 허용된 의존 방향이더라도 상대경로 deep-import
import { TocSidebar } from "../../features/post-toc/ui/TocSidebar";

// ❌ 허용된 의존 방향이더라도 alias deep-import
import { TocSidebar } from "@/features/post-toc/ui/TocSidebar";
```

문제는 이런 규칙을 사람이 계속 의식하며 지키기엔 생각보다 번거롭다는 점이었습니다.  
특히 IDE 자동 import는 대체로 “지금 resolve만 되면 되는 경로”를 제안하지, “지금 프로젝트가 원하는 FSD 스타일”까지 알아서 맞춰주진 않으니까요.

그래서 결국 <a href="https://github.com/bellmanjang/blog.jangjong.in/tree/main/packages/eslint-fsd-next-app" target="_blank">eslint-fsd-next-app</a>를 직접 만들어서 적용했습니다.

다만 이 플러그인이 FSD 전체를 전부 담당하는 건 아닙니다.  
같은 layer의 다른 slice 간 import 금지나 boundary 간 의존 방향 제약 같은 부분은 `eslint-plugin-boundaries`로 처리하고,  
제가 만든 플러그인은 그 위에서 import/public API 규칙을 강제하는 식으로 역할을 나눴습니다.

# 플러그인 규칙과 설계

## eslint-fsd-next-app에서 강제하는 규칙

1. 같은 slice 내부에서는 non-barrel relative import만 허용
2. 다른 slice를 import할 때는 공개 진입점만 허용
3. deep import 금지
4. slice는 반드시 공개 진입점(예: `index.ts`) 보유
5. alias 경로 자동 추론

이걸 실제 구현에서는 아래 3개의 rule로 나눴습니다.

- `fsd/exports-imports`: 같은 slice 내부 상대경로, boundary 간 공개 진입점 import, deep import 금지, 공개 진입점 존재 여부 검사
- `fsd/no-slice-root-code-files`: slice root와 공개 진입점이 필요한 segment root 바로 아래에 구현 파일이 놓이지 않도록 검사
- `fsd/prefer-alias-imports`: `src/...` 같은 경로를 alias import로 정규화

## 프로젝트 구조를 어떻게 해석할지

규칙만 정하는 것으로는 부족했고, 프로젝트 구조를 플러그인이 어떻게 해석할지도 함께 정해야 했습니다.  
공식 문서에서도 `app`과 `shared`는 일반적인 slice layer가 아니라, segment로 직접 나뉘는 특수한 layer로 설명합니다.  
여기에 더해 제 프로젝트의 `app`은 `Next.js App Router`가 직접 사용하는 영역이라, 일반적인 FSD app layer보다는 프레임워크 전용 엔트리 폴더에 가깝게 해석했습니다.  
그래서 플러그인 옵션 기본값은 다음처럼 잡았습니다.

- `pages`, `widgets`, `features`, `entities`는 slice layer
- `app`, `shared`는 segment layer
- 기본값 기준으로 `app`은 공개 진입점를 강제하지 않음
- 기본값 기준으로 `shared`는 외부 소비를 위한 공개 진입점를 가짐

다만 이 부분은 FSD 공식 규칙을 그대로 따른다기보다, 제 프로젝트에서 shared의 경계를 더 명확히 하기 위해 추가한 해석도 포함되어 있습니다.  
또한 제 프로젝트에서는 앞에서 설명한 이유로 `pages` 레이어를 따로 두지 않았기 때문에, 실제 적용할 때는 `sliceLayers` 설정에서 `pages`를 제외했습니다.

## 구현하면서 추가한 기능들

- `tsconfig.json`의 `paths`를 읽어서 alias를 자동 추론
- alias가 여러 개면 더 구체적인 alias를 우선 선택
- 기본값 기준으로 `shared` segment root에도 공개 진입점만 두도록 검사
- barrel import를 실제 relative deep path로 바꿀 수 있을 때만 autofix
- 여러 파일로 갈라져서 unsafe해지는 경우는 report-only로 유지

결국 지금은 단순한 “import 경로 스타일 검사”보다는, 프로젝트 구조 해석기 같은 느낌이 조금 더 강해졌습니다.

# 실제 프로젝트 구조 변화

플러그인을 만들기만 한 게 아니라, 제 블로그 코드에도 바로 적용했습니다.  
적용하다 보니 구조상 애매했던 부분들이 꽤 많이 드러났어요.

예를 들어:

- `features/markdown`에 있던 범용 Markdown 처리 로직은 여러 곳에서 재사용될 수 있다고 판단해 `shared/markdown`으로 내렸고
- 포스트 관련 코드는 `entities/post`, `widgets/post`, `features/post-toc`로 나눴으며
- `shared`도 그냥 “잡다한 util 모음”처럼 두지 않고 segment 단위 공개 진입점를 갖도록 정리했습니다.

즉 플러그인을 만드는 과정이 곧 구조 리팩터링 과정이기도 했습니다.

# 마무리

이번에 느낀 건 두 가지였습니다.

첫 번째는, `FSD`는 구조 그 자체보다 layer 간 관계와 규칙이 훨씬 중요하다는 점입니다.  
`features`, `entities`, `shared` 등의 폴더로 나누기만 한다고 해서 FSD가 되는 건 아니고, 결국 경계를 어떻게 넘나들게 할지까지 같이 정해야 의미가 살아납니다.

두 번째는, 아키텍처 규칙은 문서로만 두면 금방 무너진다는 점입니다.  
“우리 프로젝트는 이렇게 합시다”라고 정해놔도, 리뷰에서 한두 번 놓치기 시작하면 결국 서서히 흐려집니다.  
사람이 기억해야 하는 규칙은 결국 도구가 보조해줘야 오래 갑니다.

물론 아직 완벽하다고 보긴 어렵습니다.  
지금도 `FSD의 철학`과 `내 프로젝트에 맞는 해석` 사이에서 선택해야 하는 부분들이 남아 있고, 규칙을 어디까지 엄격하게 강제할지도 계속 조정 중입니다.

그래도 이번 작업을 거치고 나니 적어도 지금은:

- 코드가 어디에 있어야 하는지
- 어떤 import가 자연스러운지
- 구조가 어긋났을 때 무엇을 먼저 의심해야 하는지

이전보다 훨씬 분명해졌습니다.

아마 당분간은 이 플러그인을 조금씩 더 다듬으면서 같이 구조를 정리하게 될 것 같아요.
