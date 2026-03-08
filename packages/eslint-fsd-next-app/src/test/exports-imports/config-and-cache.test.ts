import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
    createExportsImportsEslint,
    createExportsImportsFixture,
    lintExportsImportsFile,
    readFixtureFile,
} from "./helpers.js";

test("tsconfig alias cache is invalidated when compilerOptions.paths changes", async t => {
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
        "src/app/layout.tsx":
            'import { cx } from "@/shared/lib";\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const eslint = createExportsImportsEslint({
        projectRoot,
        fix: true,
        sharedSettings: {},
    });

    let [result] = await eslint.lintFiles(["src/app/layout.tsx"]);
    assert.match(
        result.output ?? readFixtureFile(projectRoot, "src/app/layout.tsx"),
        /import \{ cx \} from "@\/shared\/lib";/,
    );

    fs.writeFileSync(
        path.join(projectRoot, "tsconfig.json"),
        JSON.stringify(
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
    );
    fs.writeFileSync(
        path.join(projectRoot, "src/app/layout.tsx"),
        'import { cx } from "@/shared/lib";\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    );

    [result] = await eslint.lintFiles(["src/app/layout.tsx"]);
    assert.match(
        result.output ?? readFixtureFile(projectRoot, "src/app/layout.tsx"),
        /import \{ cx \} from "@shared\/lib";/,
    );
});

test("tsconfig parsing supports comments and extends chains", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "tsconfig.base.json": JSON.stringify(
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
        "tsconfig.json":
            '{\n  // comment\n  "extends": "./tsconfig.base.json",\n}\n',
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
        sharedSettings: {},
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ usePost \} from "\.\.\/model\/use-post";/);
});

test("explicit fsdRoot without usable tsconfig aliases reports an invalid option", async t => {
    const projectRoot = createExportsImportsFixture(t, {
        "src/features/posts/index.ts":
            'export { usePost } from "./model/use-post";\n',
        "src/features/posts/model/use-post.ts":
            "export const usePost = () => 'post';\n",
        "src/features/posts/ui/PostCard.ts":
            'import { usePost } from "@/features/posts";\n\nexport const PostCard = () => usePost();\n',
    });

    const { result } = await lintExportsImportsFile({
        projectRoot,
        entry: "src/features/posts/ui/PostCard.ts",
        sharedSettings: {
            "fsd-root": path.join(projectRoot, "src"),
        },
    });

    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                "no compilerOptions.paths aliases resolve inside fsdRoot",
            ),
        ),
    );
});

test("missing public API reporting is invalidated when public API files are added or removed", async t => {
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

    const eslint = createExportsImportsEslint({
        projectRoot,
        sharedSettings: {
            "fsd-root": path.join(projectRoot, "src"),
        },
    });

    let [result] = await eslint.lintFiles([
        "src/features/profile/ui/ProfileCard.ts",
    ]);
    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                'Boundary "src/features/profile" must expose public API via',
            ),
        ),
    );

    fs.writeFileSync(
        path.join(projectRoot, "src/features/profile/index.ts"),
        'export { ProfileCard } from "./ui/ProfileCard";\n',
    );
    [result] = await eslint.lintFiles([
        "src/features/profile/ui/ProfileCard.ts",
    ]);
    assert.equal(result.messages.length, 0);

    fs.unlinkSync(path.join(projectRoot, "src/features/profile/index.ts"));
    [result] = await eslint.lintFiles([
        "src/features/profile/ui/ProfileCard.ts",
    ]);
    assert.ok(
        result.messages.some(message =>
            message.message.includes(
                'Boundary "src/features/profile" must expose public API via',
            ),
        ),
    );
});

test("same-slice autofix refreshes barrel export analysis after index changes", async t => {
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
        "src/features/posts/model/use-post2.ts":
            "export const usePost2 = () => 'post';\n",
        "src/features/posts/ui/PostCard.ts":
            'import { usePost } from "@/features/posts";\nexport const PostCard = () => usePost();\n',
    });

    const eslint = createExportsImportsEslint({
        projectRoot,
        fix: true,
        sharedSettings: {},
    });

    let [result] = await eslint.lintFiles([
        "src/features/posts/ui/PostCard.ts",
    ]);
    assert.match(
        result.output ??
            readFixtureFile(projectRoot, "src/features/posts/ui/PostCard.ts"),
        /import \{ usePost \} from "\.\.\/model\/use-post";/,
    );

    fs.writeFileSync(
        path.join(projectRoot, "src/features/posts/index.ts"),
        'export { usePost2 as usePost } from "./model/use-post2";\n',
    );
    fs.writeFileSync(
        path.join(projectRoot, "src/features/posts/ui/PostCard.ts"),
        'import { usePost } from "@/features/posts";\nexport const PostCard = () => usePost();\n',
    );

    [result] = await eslint.lintFiles(["src/features/posts/ui/PostCard.ts"]);
    assert.match(
        result.output ??
            readFixtureFile(projectRoot, "src/features/posts/ui/PostCard.ts"),
        /import \{ usePost2 as usePost \} from "\.\.\/model\/use-post2";/,
    );
});

test("same-slice export-map cache is invalidated when nested re-exports change", async t => {
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
        "src/features/posts/index.ts": 'export * from "./model";\n',
        "src/features/posts/model/index.ts":
            'export { usePost } from "./use-post";\n',
        "src/features/posts/model/use-post.ts":
            "export const usePost = () => 'post';\n",
        "src/features/posts/model/use-post2.ts":
            "export const usePost2 = () => 'post';\n",
        "src/features/posts/ui/PostCard.ts":
            'import { usePost } from "@/features/posts";\nexport const PostCard = () => usePost();\n',
    });

    const eslint = createExportsImportsEslint({
        projectRoot,
        fix: true,
        sharedSettings: {},
    });

    let [result] = await eslint.lintFiles([
        "src/features/posts/ui/PostCard.ts",
    ]);
    assert.match(
        result.output ??
            readFixtureFile(projectRoot, "src/features/posts/ui/PostCard.ts"),
        /import \{ usePost \} from "\.\.\/model\/use-post";/,
    );

    fs.writeFileSync(
        path.join(projectRoot, "src/features/posts/model/index.ts"),
        'export { usePost2 as usePost } from "./use-post2";\n',
    );
    fs.writeFileSync(
        path.join(projectRoot, "src/features/posts/ui/PostCard.ts"),
        'import { usePost } from "@/features/posts";\nexport const PostCard = () => usePost();\n',
    );

    [result] = await eslint.lintFiles(["src/features/posts/ui/PostCard.ts"]);
    assert.match(
        result.output ??
            readFixtureFile(projectRoot, "src/features/posts/ui/PostCard.ts"),
        /import \{ usePost2 as usePost \} from "\.\.\/model\/use-post2";/,
    );
});
