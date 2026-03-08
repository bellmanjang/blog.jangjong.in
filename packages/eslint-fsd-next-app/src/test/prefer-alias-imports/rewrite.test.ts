import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { createPreferAliasFixture, lintPreferAliasFile } from "./helpers.js";

test("root imports are rewritten to alias imports using tsconfig inference", async t => {
    const projectRoot = createPreferAliasFixture(t, {
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
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "src/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@\/shared\/lib\/class";/);
});

test("re-exports are rewritten to alias imports", async t => {
    const projectRoot = createPreferAliasFixture(t, {
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
        "src/shared/markdown/index.ts": "export const Markdown = () => null;\n",
        "src/features/post/index.ts":
            'export { Markdown } from "src/shared/markdown";\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "src/features/post/index.ts",
        fix: true,
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /export \{ Markdown \} from "@\/shared\/markdown";/);
});

test("dynamic imports are rewritten to alias imports", async t => {
    const projectRoot = createPreferAliasFixture(t, {
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
        "src/shared/ui/layout/Navbar.tsx":
            "export default function Navbar() { return null; }\n",
        "src/app/layout.tsx":
            'export async function loadNavbar() { return import("src/shared/ui/layout/Navbar"); }\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import\("@\/shared\/ui\/layout\/Navbar"\)/);
});

test("nested fsd roots rewrite project-root imports to alias imports", async t => {
    const projectRoot = createPreferAliasFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["packages/web/src/*"],
                    },
                },
            },
            null,
            2,
        ),
        "packages/web/src/shared/lib/class.ts":
            "export const cx = () => 'x';\n",
        "packages/web/src/app/layout.tsx":
            'import { cx } from "packages/web/src/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "packages/web/src/app/layout.tsx",
        fix: true,
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@\/shared\/lib\/class";/);
});

test("project-root fsdRoot still rewrites direct project-root imports to aliases", async t => {
    const projectRoot = createPreferAliasFixture(t, {
        "tsconfig.json": JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@/*": ["./*"],
                    },
                },
            },
            null,
            2,
        ),
        "shared/lib/class.ts": "export const cx = () => 'x';\n",
        "app/layout.tsx":
            'import { cx } from "shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "app/layout.tsx",
        fix: true,
        sharedSettings: {
            "fsd-root": projectRoot,
        },
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@\/shared\/lib\/class";/);
});

test("more specific aliases are preferred over the root alias", async t => {
    const projectRoot = createPreferAliasFixture(t, {
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
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "src/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@shared\/lib\/class";/);
});

test("explicit fsd root options still use more specific tsconfig aliases", async t => {
    const projectRoot = createPreferAliasFixture(t, {
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
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "src/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
        sharedSettings: {
            "fsd-root": path.join(projectRoot, "src"),
        },
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@shared\/lib\/class";/);
});

test('aliasPreference "root" prefers the root alias over more specific aliases', async t => {
    const projectRoot = createPreferAliasFixture(t, {
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
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "src/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
        sharedSettings: {
            "fsd-alias-preference": "root",
        },
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@\/shared\/lib\/class";/);
});

test("shared settings can provide rule options for prefer-alias-imports", async t => {
    const projectRoot = createPreferAliasFixture(t, {
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
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "src/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry: "src/app/layout.tsx",
        fix: true,
        settings: {
            "fsd-alias-preference": "root",
        },
    });

    assert.equal(result.messages.length, 0);
    assert.match(output, /import \{ cx \} from "@\/shared\/lib\/class";/);
});

test("already aliased imports are ignored", async t => {
    const projectRoot = createPreferAliasFixture(t, {
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
        "src/shared/lib/class.ts": "export const cx = () => 'x';\n",
        "src/app/layout.tsx":
            'import { cx } from "@/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    });

    const entry = "src/app/layout.tsx";
    const original =
        'import { cx } from "@/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n';
    const { result, output } = await lintPreferAliasFile({
        projectRoot,
        entry,
        fix: true,
    });

    assert.equal(result.messages.length, 0);
    assert.equal(output, original);
});
