import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import tsParser from "@typescript-eslint/parser";
import { ESLint } from "eslint";
import plugin from "../../index.js";
import { createPreferAliasFixture, readFixtureFile } from "./helpers.js";

test("nearest tsconfig cache is invalidated when a closer tsconfig is added", async t => {
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

    const eslint = new ESLint({
        cwd: projectRoot,
        fix: true,
        overrideConfigFile: true,
        overrideConfig: [
            {
                files: ["**/*.{ts,tsx,js,jsx,mjs}"],
                languageOptions: {
                    parser: tsParser as never,
                    parserOptions: {
                        ecmaVersion: "latest",
                        sourceType: "module",
                        ecmaFeatures: {
                            jsx: true,
                        },
                    },
                },
                plugins: {
                    fsd: plugin,
                },
                rules: {
                    "fsd/prefer-alias-imports": ["error", {}],
                },
            },
        ],
    });

    let [result] = await eslint.lintFiles(["packages/web/src/app/layout.tsx"]);
    assert.match(
        result.output ??
            readFixtureFile(projectRoot, "packages/web/src/app/layout.tsx"),
        /import \{ cx \} from "@\/shared\/lib\/class";/,
    );

    fs.writeFileSync(
        path.join(projectRoot, "packages/web/tsconfig.json"),
        JSON.stringify(
            {
                compilerOptions: {
                    baseUrl: ".",
                    paths: {
                        "@web/*": ["src/*"],
                    },
                },
            },
            null,
            2,
        ),
    );
    fs.writeFileSync(
        path.join(projectRoot, "packages/web/src/app/layout.tsx"),
        'import { cx } from "packages/web/src/shared/lib/class";\n\nexport default function Layout() { return <div>{cx()}</div>; }\n',
    );

    [result] = await eslint.lintFiles(["packages/web/src/app/layout.tsx"]);
    assert.match(
        result.output ??
            readFixtureFile(projectRoot, "packages/web/src/app/layout.tsx"),
        /import \{ cx \} from "@web\/shared\/lib\/class";/,
    );
});
