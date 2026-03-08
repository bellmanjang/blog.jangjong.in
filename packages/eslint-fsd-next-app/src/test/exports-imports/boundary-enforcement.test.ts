import assert from "node:assert/strict";
import test from "node:test";
import {
    createExportsImportsFixture,
    lintExportsImportsFile,
} from "./helpers.js";

test("tsconfig paths can infer fsdRoot and alias without explicit options", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/posts/index.ts":
            'export { getPost } from "./api/post-api";\n',
        "src/features/posts/api/post-api.ts":
            "export const getPost = () => 'post';\n",
        "src/features/comments/index.ts":
            'export { CommentCard } from "./ui/CommentCard";\n',
        "src/features/comments/ui/CommentCard.ts":
            'import { getPost } from "../../posts/api/post-api";\n\nexport const CommentCard = () => getPost();\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/features/comments/ui/CommentCard.ts",
        fix: true,
        sharedSettings: {},
    });

    assert.equal(result.messages[0]?.message, undefined);
    assert.match(output, /import \{ getPost \} from "@\/features\/posts";/);
});

test("tsconfig inference prefers the FSD root over unrelated aliases", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "~/*": ["./*"],
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/shared/lib/index.ts": 'export { cx } from "./class";\n',
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "@/shared/lib/class";\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
        sharedSettings: {},
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@\/shared\/lib";/);
});

test("sliceLayers excludes next app router files from slice boundary rules", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/posts/index.ts":
            'export { getPost } from "./api/post-api";\n',
        "src/features/posts/api/post-api.ts":
            "export const getPost = () => 'post';\n",
        "src/app/posts/page.tsx":
            'import { getPost } from "@/features/posts";\nexport default function Page() { return <div>{getPost()}</div>; }\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/posts/page.tsx",
        sharedSettings: {
            "fsd-slice-layers": ["features", "entities"],
            "fsd-segment-layers": ["shared"],
        },
    });

    assert.equal(result.messages.length, 0);
});

test("non-slice app entry files still must use public API for sliced targets", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/shared/lib/index.ts": 'export { cx } from "./class";\n',
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/shared/ui/index.ts": 'export { Navbar } from "./layout/Navbar";\n',
        "src/shared/ui/layout/Navbar.tsx":
            "export const Navbar = () => null;\n",
        "src/app/layout.tsx":
            'import { cx } from "@/shared/lib/class";\nimport { Navbar } from "../shared/ui/layout/Navbar";\n\nexport default function Layout() { return <div>{cx()}<Navbar /></div>; }\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
        sharedSettings: {
            "fsd-slice-layers": ["app"],
            "fsd-segment-layers": ["shared"],
        },
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@\/shared\/lib";/);
    assert.match(output, /import \{ Navbar \} from "@\/shared\/ui";/);
});

test("app segments can be configured to require public API files", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/app/providers/theme.ts": "export const theme = 'light';\n",
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/providers/theme.ts",
        sharedSettings: {
            "fsd-public-api-required-segment-layers": ["app", "shared"],
        },
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                'Boundary "src/app/providers" must expose public API via',
            ),
        ),
    );
});

test("dynamic imports must also use the target public API", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/posts/index.ts":
            'export { getPost } from "./api/post-api";\n',
        "src/features/posts/api/post-api.ts":
            "export const getPost = () => 'post';\n",
        "src/app/page.tsx":
            'export async function loadPost() { return import("@/features/posts/api/post-api"); }\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/page.tsx",
        fix: true,
        sharedSettings: {},
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import\("@\/features\/posts"\)/);
});

test("cross-boundary fixes prefer the most specific alias mapping", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                        "@shared/*": ["src/shared/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/shared/lib/index.ts":
            'export { safeDecodeURIComponent } from "./decode";\n',
        "src/shared/lib/decode.ts":
            "export const safeDecodeURIComponent = (value: string) => value;\n",
        "src/entities/post/index.ts": "export {};\n",
        "src/entities/post/api/post.ts":
            'import { safeDecodeURIComponent } from "../../../shared/lib";\nexport const read = () => safeDecodeURIComponent("x");\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/entities/post/api/post.ts",
        fix: true,
        sharedSettings: {},
    });

    assert.equal(result.messages.length, 0);
    assert.match(
        output,
        /import \{ safeDecodeURIComponent \} from "@shared\/lib";/,
    );
});

test("custom publicApiFiles are accepted as cross-boundary public API endpoints", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/post-toc/public.ts":
            'export { TocSidebar } from "./ui/TocSidebar";\n',
        "src/features/post-toc/ui/TocSidebar.tsx":
            "export const TocSidebar = () => null;\n",
        "src/widgets/post/public.ts":
            'export { Article } from "./ui/Article";\n',
        "src/widgets/post/ui/Article.tsx":
            'import { TocSidebar } from "@/features/post-toc/public";\nexport const Article = () => <TocSidebar />;\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/widgets/post/ui/Article.tsx",
        sharedSettings: {
            "fsd-public-api-files": ["public.ts"],
            "fsd-slice-layers": ["widgets", "features", "entities"],
        },
    });

    assert.equal(result.messages.length, 0);
});

test("shared settings can provide publicApiFiles for fsd/exports-imports", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/post-toc/public.ts":
            'export { TocSidebar } from "./ui/TocSidebar";\n',
        "src/features/post-toc/ui/TocSidebar.tsx":
            "export const TocSidebar = () => null;\n",
        "src/widgets/post/public.ts":
            'export { Article } from "./ui/Article";\n',
        "src/widgets/post/ui/Article.tsx":
            'import { TocSidebar } from "@/features/post-toc/public";\nexport const Article = () => <TocSidebar />;\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/widgets/post/ui/Article.tsx",
        sharedSettings: {
            "fsd-slice-layers": ["widgets", "features", "entities"],
        },
        settings: {
            "fsd-public-api-files": ["public.ts"],
        },
    });

    assert.equal(result.messages.length, 0);
});

test("cross-boundary fixes use configured custom public API files", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/post-toc/public.ts":
            'export { TocSidebar } from "./ui/TocSidebar";\n',
        "src/features/post-toc/ui/TocSidebar.tsx":
            "export const TocSidebar = () => null;\n",
        "src/widgets/post/public.ts":
            'export { Article } from "./ui/Article";\n',
        "src/widgets/post/ui/Article.tsx":
            'import { TocSidebar } from "../../../features/post-toc/ui/TocSidebar";\nexport const Article = () => <TocSidebar />;\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/widgets/post/ui/Article.tsx",
        fix: true,
        sharedSettings: {
            "fsd-public-api-files": ["public.ts"],
            "fsd-slice-layers": ["widgets", "features", "entities"],
        },
    });

    assert.equal(result.messages.length, 0);
    assert.match(
        output,
        /import \{ TocSidebar \} from "@\/features\/post-toc\/public";/,
    );
});

test("boundary-root imports with missing custom public API do not report as deep imports", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/entities/post/index.ts":
            'export type { Post } from "./model/post";\n',
        "src/entities/post/model/post.ts":
            "export type Post = { id: string };\n",
        "src/widgets/post/public.ts":
            'export { Article } from "./ui/Article";\n',
        "src/widgets/post/ui/Article.tsx":
            'import type { Post } from "@/entities/post";\nexport type ArticleProps = { post: Post };\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/widgets/post/ui/Article.tsx",
        sharedSettings: {
            "fsd-public-api-files": ["public.ts"],
            "fsd-slice-layers": ["widgets", "features", "entities"],
        },
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                "slice must expose public API via public.ts",
            ),
        ),
    );
    assert.equal(
        result.messages.some(message =>
            message.message.includes("Do not deep-import across slices"),
        ),
        false,
    );
});

test("boundary-root imports are rewritten to the configured custom public API file", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/entities/post/index.ts":
            'export type { Post } from "./model/post";\n',
        "src/entities/post/public.ts":
            'export type { Post } from "./model/post";\n',
        "src/entities/post/model/post.ts":
            "export type Post = { id: string };\n",
        "src/widgets/post/public.ts":
            'export { Article } from "./ui/Article";\n',
        "src/widgets/post/ui/Article.tsx":
            'import type { Post } from "@/entities/post";\nexport type ArticleProps = { post: Post };\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/widgets/post/ui/Article.tsx",
        fix: true,
        sharedSettings: {
            "fsd-public-api-files": ["public.ts"],
            "fsd-slice-layers": ["widgets", "features", "entities"],
        },
    });

    assert.equal(result.messages.length, 0);
    assert.match(
        output,
        /import type \{ Post \} from "@\/entities\/post\/public";/,
    );
});

test("less specific root alias public API imports are rewritten to the most specific alias by default", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                        "@shared/*": ["src/shared/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/shared/lib/index.ts": 'export { cx } from "./class";\n',
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "@/shared/lib";\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
        sharedSettings: {},
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@shared\/lib";/);
});

test('aliasPreference "root" keeps the root alias public API import style', async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                        "@shared/*": ["src/shared/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/shared/lib/index.ts": 'export { cx } from "./class";\n',
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "@/shared/lib";\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        sharedSettings: {
            "fsd-alias-preference": "root",
        },
    });

    assert.equal(result.messages.length, 0);
});

test("cross-slice relative import must go through public API", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/posts/index.ts":
            'export { getPost } from "./api/post-api";\n',
        "src/features/posts/api/post-api.ts":
            "export const getPost = () => 'post';\n",
        "src/features/comments/index.ts":
            'export { CommentCard } from "./ui/CommentCard";\n',
        "src/features/comments/ui/CommentCard.ts":
            'import { getPost } from "../../posts/api/post-api";\n\nexport const CommentCard = () => getPost();\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/features/comments/ui/CommentCard.ts",
        fix: true,
    });

    assert.equal(result.messages[0]?.message, undefined);
    assert.match(output, /import \{ getPost \} from "@\/features\/posts";/);
});

test("slice without index.ts(x) is reported", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/profile/ui/ProfileCard.ts":
            "export const ProfileCard = () => null;\n",
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/features/profile/ui/ProfileCard.ts",
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes("must expose public API via"),
        ),
    );
});

test("javascript index public APIs are accepted", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/post/index.js":
            "export { PostCard } from './ui/PostCard.js';\n",
        "src/features/post/ui/PostCard.js":
            "export const PostCard = () => null;\n",
        "src/app/page.js":
            'import { PostCard } from "@/features/post";\nexport default PostCard;\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/page.js",
        sharedSettings: {},
    });

    assert.equal(result.messages.length, 0);
});

test("autofix stays disabled when target public API cannot resolve safely", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "src/features/posts/api/post-api.ts":
            "export const getPost = () => 'post';\n",
        "src/features/comments/index.ts":
            'export { CommentCard } from "./ui/CommentCard";\n',
        "src/features/comments/ui/CommentCard.ts":
            'import { getPost } from "../../posts/api/post-api";\n\nexport const CommentCard = () => getPost();\n',
    });

    const entry = "src/features/comments/ui/CommentCard.ts";
    const original = `import { getPost } from "../../posts/api/post-api";\n\nexport const CommentCard = () => getPost();\n`;
    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry,
        fix: true,
    });

    assert.ok(
        result.messages.some(
            message =>
                message.message.includes("public API") &&
                message.message.includes("directory import"),
        ),
    );
    assert.equal(output, original);
});
