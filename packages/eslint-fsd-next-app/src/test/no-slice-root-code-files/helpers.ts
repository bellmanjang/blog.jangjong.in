import tsParser from "@typescript-eslint/parser";
import { ESLint } from "eslint";
import plugin from "../../index.js";
import {
    createFixture,
    mergeFsdSettings,
    type TestContext,
} from "../helpers.js";

export function createNoSliceRootFixture(
    t: TestContext,
    structure: Record<string, string>,
) {
    return createFixture(t, "fsd-slice-root-", structure);
}

export async function lintNoSliceRootFile(params: {
    projectRoot: string;
    entry: string;
    sharedSettings?: Record<string, unknown>;
    settings?: Record<string, unknown>;
}) {
    const mergedSettings = mergeFsdSettings(
        params.settings,
        params.sharedSettings,
    );

    const eslint = new ESLint({
        cwd: params.projectRoot,
        overrideConfigFile: true,
        overrideConfig: [
            {
                files: ["**/*.{ts,tsx,js,jsx}"],
                languageOptions: {
                    parser: tsParser as never,
                    parserOptions: {
                        ecmaVersion: "latest",
                        sourceType: "module",
                    },
                },
                plugins: {
                    fsd: plugin,
                },
                settings: mergedSettings,
                rules: {
                    "fsd/no-slice-root-code-files": "error",
                },
            },
        ],
    });

    const [result] = await eslint.lintFiles([params.entry]);
    return result;
}
