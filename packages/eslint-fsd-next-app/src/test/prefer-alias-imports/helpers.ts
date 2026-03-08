import tsParser from "@typescript-eslint/parser";
import { ESLint } from "eslint";
import plugin from "../../index.js";
import {
    createFixture,
    mergeFsdSettings,
    readFixtureFile,
    type TestContext,
} from "../helpers.js";

export function createPreferAliasFixture(
    t: TestContext,
    structure: Record<string, string>,
) {
    return createFixture(t, "fsd-alias-", structure);
}

export async function lintPreferAliasFile(params: {
    projectRoot: string;
    entry: string;
    fix?: boolean;
    sharedSettings?: Record<string, unknown>;
    settings?: Record<string, unknown>;
}) {
    const mergedSettings = mergeFsdSettings(
        params.settings,
        params.sharedSettings,
    );

    const eslint = new ESLint({
        cwd: params.projectRoot,
        fix: params.fix ?? false,
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
                settings: mergedSettings,
                rules: {
                    "fsd/prefer-alias-imports": "error",
                },
            },
        ],
    });

    const [result] = await eslint.lintFiles([params.entry]);
    return {
        result,
        output:
            result.output ?? readFixtureFile(params.projectRoot, params.entry),
    };
}

export { readFixtureFile };
