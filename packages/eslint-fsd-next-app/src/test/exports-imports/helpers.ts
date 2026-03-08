import tsParser from "@typescript-eslint/parser";
import { ESLint } from "eslint";
import plugin from "../../index.js";
import {
    createFixture,
    mergeFsdSettings,
    readFixtureFile,
    type TestContext,
} from "../helpers.js";

export function createExportsImportsFixture(
    t: TestContext,
    structure: Record<string, string>,
) {
    return createFixture(t, "exports-imports-", structure);
}

export function createExportsImportsEslint(params: {
    projectRoot: string;
    fix?: boolean;
    sharedSettings?: Record<string, unknown>;
    settings?: Record<string, unknown>;
}) {
    const mergedSettings = mergeFsdSettings(
        params.settings,
        params.sharedSettings,
    );

    return new ESLint({
        cwd: params.projectRoot,
        fix: params.fix ?? false,
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
                    "fsd/exports-imports": "error",
                },
            },
        ],
    });
}

export async function lintExportsImportsFile(params: {
    projectRoot: string;
    entry: string;
    fix?: boolean;
    sharedSettings?: Record<string, unknown>;
    settings?: Record<string, unknown>;
}) {
    const eslint = createExportsImportsEslint(params);
    const [result] = await eslint.lintFiles([params.entry]);

    return {
        result,
        output:
            result.output ?? readFixtureFile(params.projectRoot, params.entry),
    };
}

export { readFixtureFile };
