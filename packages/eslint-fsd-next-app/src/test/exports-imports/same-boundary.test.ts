import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
    createExportsImportsFixture,
    lintExportsImportsFile,
    readFixtureFile,
} from "./helpers.js";

test("same-slice public API import is rewritten to relative deep path", async t => {
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
            'export { usePost } from "./model/use-post";\n',
        "src/features/posts/model/use-post.ts":
            "export const usePost = () => 'post';\n",
        "src/features/posts/ui/PostCard.ts":
            'import { usePost } from "@/features/posts";\n\nexport const PostCard = () => usePost();\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/features/posts/ui/PostCard.ts",
        fix: true,
    });

    assert.equal(result.messages[0]?.message, undefined);
    assert.match(output, /import \{ usePost \} from "\.\.\/model\/use-post";/);
});

test("same-slice custom public API file import is rewritten to relative deep path", async t => {
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
            'export { HashScroller } from "./lib/hash-scroller";\n',
        "src/features/post-toc/lib/hash-scroller.ts":
            "export const HashScroller = () => 'scroll';\n",
        "src/features/post-toc/ui/Toc.ts":
            'import { HashScroller } from "@/features/post-toc/public";\n\nexport const Toc = () => HashScroller();\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/features/post-toc/ui/Toc.ts",
        fix: true,
        sharedSettings: {
            "fsd-public-api-files": ["public.ts"],
        },
    });

    assert.equal(result.messages[0]?.message, undefined);
    assert.match(
        output,
        /import \{ HashScroller \} from "\.\.\/lib\/hash-scroller";/,
    );
});

test("same-slice boundary-root barrel imports are rewritten to relative deep paths when custom public API files are configured", async t => {
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
        "src/features/post-toc/index.ts":
            'export { HashScroller } from "./lib/hash-scroller";\n',
        "src/features/post-toc/public.ts":
            'export { HashScroller } from "./lib/hash-scroller";\n',
        "src/features/post-toc/lib/hash-scroller.ts":
            "export const HashScroller = () => 'scroll';\n",
        "src/features/post-toc/ui/Toc.ts":
            'import { HashScroller } from "@/features/post-toc";\n\nexport const Toc = () => HashScroller();\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/features/post-toc/ui/Toc.ts",
        fix: true,
        sharedSettings: {
            "fsd-public-api-files": ["public.ts"],
        },
    });

    assert.equal(result.messages.length, 0);
    assert.match(
        output,
        /import \{ HashScroller \} from "\.\.\/lib\/hash-scroller";/,
    );
});

test("same-boundary asset imports must use relative paths", async t => {
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
        "src/app/_styles/reset.css": "html { margin: 0; }\n",
        "src/app/_styles/global.scss": "body { color: black; }\n",
        "src/app/layout.tsx":
            'import "./_styles/reset.css";\nimport "@/app/_styles/global.scss";\n\nexport default function Layout() { return null; }\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
        sharedSettings: {},
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import "\.\/_styles\/reset\.css";/);
    assert.match(output, /import "\.\/_styles\/global\.scss";/);
});

test("shared segment layer can import other shared segments freely", async t => {
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
            'import { cx } from "../../lib/class";\nexport const Navbar = () => <div>{cx()}</div>;\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/shared/ui/layout/Navbar.tsx",
        sharedSettings: {
            "fsd-root": path.join(projectRoot, "src"),
            "fsd-segment-layers": ["shared"],
        },
    });

    assert.equal(result.messages.length, 0);
});

test("app segment layer can import other app segments freely without public api", async t => {
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
        "src/app/providers/theme.ts": "export const theme = 'dark';\n",
        "src/app/posts/page.tsx":
            'import { theme } from "../providers/theme";\nexport default function Page() { return <div>{theme}</div>; }\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/posts/page.tsx",
        sharedSettings: {
            "fsd-root": path.join(projectRoot, "src"),
            "fsd-segment-layers": ["app", "shared"],
        },
    });

    assert.equal(result.messages.length, 0);
});

test("app root-level modules still participate in same-boundary relative import rules", async t => {
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
        "src/app/providers.ts": "export const theme = 'dark';\n",
        "src/app/page.tsx":
            'import { theme } from "@/app/providers";\nexport default function Page() { return <div>{theme}</div>; }\n',
    });

    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/app/page.tsx",
        fix: true,
        sharedSettings: {},
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ theme \} from "\.\/providers";/);
});

test("same-slice autofix is disabled when a binding is defined directly in index.ts", async t => {
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
        "src/features/posts/index.ts": "export const usePost = () => 'post';\n",
        "src/features/posts/ui/PostCard.ts":
            'import { usePost } from "@/features/posts";\nexport const PostCard = () => usePost();\n',
    });

    const entry = "src/features/posts/ui/PostCard.ts";
    const original = readFixtureFile(projectRoot, entry);
    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry,
        fix: true,
        sharedSettings: {},
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                "Within the same slice, do not import through the slice public API file.",
            ),
        ),
    );
    assert.equal(output, original);
});

test("same-slice barrel imports that would split into multiple modules are not autofixed", async t => {
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
            'export { a } from "./model/a";\nexport { b } from "./model/b";\n',
        "src/features/posts/model/a.ts": "export const a = 1;\n",
        "src/features/posts/model/b.ts": "export const b = 2;\n",
        "src/features/posts/ui/PostCard.ts":
            'import { a, b } from "@/features/posts";\nexport const PostCard = () => a + b;\n',
    });

    const entry = "src/features/posts/ui/PostCard.ts";
    const original = fs.readFileSync(path.join(projectRoot, entry), "utf8");
    const { result, output } = await lintExportsImportsFile({
        projectRoot,
        entry,
        fix: true,
        sharedSettings: {},
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                "Within the same slice, do not import through the slice public API file.",
            ),
        ),
    );
    assert.equal(output, original);
});
