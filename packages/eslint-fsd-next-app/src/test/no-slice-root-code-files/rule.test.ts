import assert from "node:assert/strict";
import test from "node:test";
import { createNoSliceRootFixture, lintNoSliceRootFile } from "./helpers.js";

test("reports non-public code files placed directly under a slice root", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/features/post/date.ts": "export const today = () => new Date();\n",
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/features/post/date.ts",
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                'Slice root "features/post" must only expose public API files',
            ),
        ),
    );
});

test("does not report nested files inside slice segments", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/features/post/lib/date.ts":
            "export const today = () => new Date();\n",
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/features/post/lib/date.ts",
    });

    assert.equal(result.messages.length, 0);
});

test("does not report slice public API files", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/features/post/index.ts":
            'export { PostCard } from "./ui/PostCard";\n',
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/features/post/index.ts",
    });

    assert.equal(result.messages.length, 0);
});

test("does not report javascript slice public API files by default", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
            'export { PostCard } from "./ui/PostCard.js";\n',
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/features/post/index.js",
    });

    assert.equal(result.messages.length, 0);
});

test("does not report segment layers like shared by default", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/shared/date.ts": "export const today = () => new Date();\n",
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/shared/date.ts",
    });

    assert.equal(result.messages.length, 0);
});

test("reports non-public code files placed directly under a shared segment root", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/shared/lib/date.ts": "export const today = () => new Date();\n",
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/shared/lib/date.ts",
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                'Segment root "shared/lib" must only expose public API files',
            ),
        ),
    );
});

test("does not report shared segment public API files", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/shared/lib/index.ts": 'export { today } from "./date";\n',
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/shared/lib/index.ts",
    });

    assert.equal(result.messages.length, 0);
});

test("does not report app segment root files", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/app/posts/page.tsx":
            "export default function Page() { return null; }\n",
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/app/posts/page.tsx",
    });

    assert.equal(result.messages.length, 0);
});

test("can require public API files for app segments explicitly", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/app/providers/theme.ts",
        sharedSettings: {
            "fsd-public-api-required-segment-layers": ["app", "shared"],
        },
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                'Segment root "app/providers" must only expose public API files',
            ),
        ),
    );
});

test("public API filenames can be customized", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/features/post/public.ts":
            'export { PostCard } from "./ui/PostCard";\n',
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/features/post/public.ts",
        sharedSettings: {
            "fsd-public-api-files": ["public.ts"],
        },
    });

    assert.equal(result.messages.length, 0);
});

test("shared settings can provide publicApiFiles for no-slice-root-code-files", async t => {
    const projectRoot = createNoSliceRootFixture(t, {
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
        "src/features/post/public.ts":
            'export { PostCard } from "./ui/PostCard";\n',
    });

    const result = await lintNoSliceRootFile({
        projectRoot,
        entry: "src/features/post/public.ts",
        settings: {
            "fsd-public-api-files": ["public.ts"],
        },
    });

    assert.equal(result.messages.length, 0);
});
