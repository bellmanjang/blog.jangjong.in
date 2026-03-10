# `@bellmanjang/eslint-fsd-next-app`

ESLint plugin for enforcing a practical Feature-Sliced Design import style in projects that do not exactly match the official example layout.

This plugin started from four requirements:

1. Same slice: use real relative imports, not the slice public API barrel.
2. Cross-slice: use public API only. No deep import. No relative import.
3. Each slice must expose a public API file.
4. Autofix must be safe. Only rewrite when the target path really resolves.

The current implementation extends that model to support:

- `app` and `shared` as special segment layers
- `tsconfig.json` alias inference
- multiple alias mappings with configurable canonical style
- shared settings through prefixed ESLint `settings`
- slice root and shared-segment-root layout checks

## What This Plugin Covers

This plugin focuses on import style and public API shape inside an FSD-like source tree:

- same-slice relative imports
- cross-slice public API imports
- `app` and `shared` segment-layer handling
- public API existence
- alias normalization
- slice root and shared segment root file layout

This plugin does **not** enforce full layer dependency direction such as:

- `widgets -> features/entities/shared only`
- `features -> entities/shared only`

That is intentionally out of scope. Use another rule set such as `eslint-plugin-boundaries` for layer dependency rules.

## Quick Start

Use shared plugin settings through ESLint `settings`.

```js
import fsd from "@bellmanjang/eslint-fsd-next-app";

export default [
  {
    plugins: {fsd},
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

If you use a Next.js-style custom structure where `src/app` is the app router root and FSD slice layers start from `widgets`, configure it like this:

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

If your public API file is not `index.ts`, configure it explicitly:

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

### Slice layers

By default, these layers are treated as normal FSD slice layers:

- `pages`
- `widgets`
- `features`
- `entities`

The boundary unit is:

- `src/<layer>/<slice>`

Examples:

- `src/pages/post`
- `src/widgets/post-list`
- `src/features/post-toc`
- `src/entities/post`

### Segment layers

By default, these layers are treated as special segment layers:

- `app`
- `shared`

The boundary unit is:

- `src/<layer>/<segment>`

Examples:

- `src/shared/lib`
- `src/shared/markdown`
- `src/app/providers`

`app` and `shared` are treated as “one big slice split into segments”.

That means:

- imports inside the same `app` layer are allowed
- imports inside the same `shared` layer are allowed
- same-boundary imports are still normalized to relative paths

Important distinction:

- by default, `app` does **not** require a public API file
- by default, `shared` segments **do** require a public API file when consumed across boundaries
- segment roots in layers that require public APIs should contain public API files only

### Non-boundary files

Files inside the FSD root but outside a recognized slice or segment boundary are treated as external consumers of sliced targets.

Example:

- `src/app/layout.tsx`

When such a file imports `shared/lib`, `features/post`, or `entities/post`, it must use the target boundary public API.

## Rule Overview

This plugin exposes three rules:

- `fsd/exports-imports`
  Enforces relative imports inside the same boundary, public API imports across boundaries, and missing public API diagnostics.
- `fsd/no-slice-root-code-files`
  Prevents implementation files directly under slice roots and under segment roots in layers that require public APIs.
- `fsd/prefer-alias-imports`
  Rewrites project-root imports like `src/...` to configured alias imports.

## Rule: `fsd/exports-imports`

This is the main rule.

### What it enforces

#### 1. Same-slice imports must be relative

If code imports from its own slice through the slice barrel, the rule reports it.

```ts
// src/features/posts/ui/PostCard.ts
import { usePost } from "@/features/posts";
```

becomes:

```ts
import { usePost } from "../model/use-post";
```

The rule analyzes barrel re-exports and resolves the actual module path when safe.

#### 2. Cross-slice imports must use public API

Disallowed:

```ts
import { getPost } from "../api/post-api";
import { getPost } from "@/features/posts/api/post-api";
```

Allowed:

```ts
import { getPost } from "@/features/posts";
```

#### 3. Required public API files must exist

If a slice, or a segment that requires public API, is missing its public API file, the rule reports it.

Examples:

- `src/features/posts/index.ts`
- `src/entities/post/index.ts`
- `src/shared/lib/index.ts`

By default, `app` is not included in `"fsd-public-api-required-segment-layers"`, so it is exempt from this requirement.

#### 4. Same-boundary imports should be relative

Inside the same boundary, alias imports are rewritten to relative imports.

This applies to:

- same slice
- same `shared` layer
- same `app` layer
- same-boundary asset imports such as `.css` and `.scss`

```ts
import "@/app/_styles/global.scss";
```

inside `src/app/layout.tsx` becomes:

```ts
import "./_styles/global.scss";
```

### Public API labels used by the rule

The rule distinguishes:

- slice public API
- segment public API

Examples:

- `@/features/posts`
- `@/entities/post`
- `@/shared/lib`
- `@/shared/ui`

### Safe autofix policy

The rule only autofixes when the rewritten path can be resolved safely.

Current safe-fix cases:

- relative cross-boundary import -> preferred alias public API
- deep alias cross-boundary import -> preferred alias public API
- same-boundary alias import -> relative import
- same-slice barrel import -> actual relative deep import when all imported bindings resolve to one underlying file

Intentional no-fix cases:

- target public API does not exist
- rewritten path cannot be resolved
- same-slice barrel import would have to split into imports from multiple files
- namespace import from the same-slice barrel

The multi-file split case is intentionally report-only because splitting a barrel import across multiple files can change module evaluation order.

## Rule: `fsd/no-slice-root-code-files`

This rule enforces a boundary-root layout convention:

- implementation files should live in segments such as `ui`, `model`, `lib`, `api`
- slice roots should expose public API only
- segment roots in layers that require public APIs should expose public API only

Examples:

- allowed: `src/features/post/index.ts`
- disallowed: `src/features/post/types.ts`
- allowed: `src/shared/lib/index.ts`
- disallowed: `src/shared/lib/date.ts`

Default behavior:

- applies to slice roots
- applies to segment roots that require public APIs, such as `shared/lib`
- by default, does not apply to `app`, because `app` is not included in `"fsd-public-api-required-segment-layers"`

Allowed public API files are controlled by `"fsd-public-api-files"`.

Default public API files:

- `index.ts`
- `index.tsx`
- `index.js`
- `index.jsx`
- `index.mts`
- `index.cts`
- `index.mjs`
- `index.cjs`

## Rule: `fsd/prefer-alias-imports`

This rule rewrites project-root path imports such as `src/...` to configured alias imports.

```ts
import { cx } from "src/shared/lib/class";
export { Markdown } from "src/shared/markdown";
const mod = import("src/shared/ui/layout/Navbar");
```

can be rewritten to:

```ts
import { cx } from "@shared/lib/class";
export { Markdown } from "@shared/markdown";
const mod = import("@shared/ui/layout/Navbar");
```

The fix is only applied if the alias path resolves to the same actual file.

## Shared Settings Reference

All common configuration lives in prefixed ESLint `settings` keys.

There are currently no rule-specific options.

Precedence:

1. prefixed `settings`
2. plugin default

### `"fsd-root"?: string`

Explicitly sets the FSD root directory.

Examples:

- `"src"`
- `"/abs/path/to/src"`

If omitted, the plugin tries to infer the root from `tsconfig.json` path aliases.

### `"fsd-tsconfig-path"?: string`

Explicitly sets the `tsconfig.json` file used for alias inference.

If omitted, the plugin searches for the nearest `tsconfig.json` from the file being linted and falls back to `<projectRoot>/tsconfig.json`.

### `"fsd-alias-preference"?: "root" | "most-specific"`

Controls which alias style is canonical.

Default:

```ts
"most-specific"
```

Meaning:

- if both `@/* -> src/*` and `@shared/* -> src/shared/*` exist
- imports into `src/shared/*` prefer `@shared/*`

If you want a single root alias style:

```ts
"fsd-alias-preference": "root"
```

The rule and the fixer use the same alias selection logic. Non-preferred alias styles are fixable to the preferred style.

### `"fsd-exts"?: string[]`

Code extensions used for resolution and public API detection.

Default:

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

Layers treated as normal slice layers.

Default:

```ts
["pages", "widgets", "features", "entities"]
```

### `"fsd-segment-layers"?: string[]`

Layers treated as special segment layers.

Default:

```ts
["app", "shared"]
```

### `"fsd-public-api-required-segment-layers"?: string[]`

Segment layers that must expose boundary public API files.

Default:

```ts
["shared"]
```

Meaning:

- slice layers always require public API files
- segment layers only require public API files if they are listed here
- by default, `shared` requires public APIs, but `app` does not

### `"fsd-public-api-files"?: string[]`

Shared by `fsd/exports-imports` and `fsd/no-slice-root-code-files`.

Overrides which files count as boundary public API endpoints.

Examples:

- default: `index.ts`, `index.tsx`, `index.js`, ...
- custom: `public.ts`

If you set `"fsd-public-api-files": ["public.ts"]`, then:

- `fsd/no-slice-root-code-files` allows `src/features/post/public.ts`
- `fsd/exports-imports` accepts `@/features/post/public` as the slice public API

## Alias Inference

The plugin reads `compilerOptions.paths` from `tsconfig.json`.

It supports:

- comments
- trailing commas
- `extends` chains

The parser uses the TypeScript config API, not plain `JSON.parse`.

When aliases are available, the plugin:

1. collects all alias mappings
2. infers the most likely FSD root from those mappings
3. keeps all alias mappings inside the inferred or explicit root
4. picks a canonical alias according to `"fsd-alias-preference"`

`fsd/exports-imports` and `fsd/prefer-alias-imports` require at least one alias mapping that resolves inside the effective FSD root, whether that root is explicit or inferred. If no such mapping exists, both rules report an invalid configuration instead of silently degrading.

### Multiple path aliases

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

When multiple `paths` aliases can resolve the same target, the default alias preference normalizes imports to the most specific matching alias:

```ts
import { cx } from "@shared/lib";
```

not:

```ts
import { cx } from "@/shared/lib";
```

## Relationship With FSD Docs

This plugin follows the spirit of FSD, but it is intentionally adapted for real projects.

Key interpretation choices:

- `pages`, `widgets`, `features` and `entities` are slice layers
- `app` and `shared` are segment layers
- `app` and `shared` allow internal relative imports
- by default, `shared` segments still expose public APIs for cross-boundary consumption
- by default, `app` does not require `index.ts(x)` public APIs

This matches a practical Next.js-oriented setup such as:

```txt
src/
├─ app/
├─ widgets/
├─ features/
├─ entities/
└─ shared/
```

## Known Limitations

- This package does not enforce layer dependency direction.
- Multi-file same-slice barrel imports are reported but intentionally not autofixed.
- Namespace imports from same-slice barrels are reported but not autofixed.
- Public API existence is based on configured code extensions only.
- Non-code assets are not treated as public APIs, but same-boundary alias imports to them are normalized to relative imports.

## Test Coverage Summary

The current tests cover:

- same-slice barrel to relative deep import
- cross-slice relative to public API
- missing public API reporting
- JavaScript public API files
- `tsconfig` root and alias inference
- multiple alias mappings
- `"fsd-alias-preference": "root"` and `"most-specific"`
- same-boundary asset imports
- explicit `"fsd-root"` invalid config when aliases are missing
- cache invalidation for public API reporting
- cache invalidation for same-slice barrel analysis
- cache invalidation for `fsd/prefer-alias-imports`
- no-fix behavior for unsafe multi-file same-slice barrel splitting

## Local Development

Package scripts:

```bash
bun run --filter @bellmanjang/eslint-fsd-next-app build
bun run --filter @bellmanjang/eslint-fsd-next-app test
```

The package runtime depends on `typescript` because it uses the TypeScript config parser and AST utilities.

## Implementation Structure

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
