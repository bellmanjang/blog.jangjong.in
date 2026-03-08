import path from "node:path";
import type { Rule } from "eslint";
import type { Program } from "estree";
import {
    getBestAliasSpecifierForTarget,
    isAliasImport,
} from "../core/alias-utils.js";
import { resolveRuleConfig } from "../core/config.js";
import type { ImportLikeNode } from "../core/import-utils.js";
import {
    getSourceLiteral,
    isRelativeImport,
    replaceSourceLiteral,
    resolveBaseToExistingFile,
    resolveToExistingFile,
} from "../core/import-utils.js";
import {
    isWithinDir,
    normalize,
    toRealPathIfExists,
} from "../core/path-utils.js";
import { getSharedSettings } from "../core/shared-settings.js";

function reportInvalidOption(params: {
    context: Rule.RuleContext;
    node: Program;
    error: string;
}) {
    params.context.report({
        node: params.node,
        message: `fsd/prefer-alias-imports invalid option: ${params.error}`,
    });
}

const rule: Rule.RuleModule = {
    meta: {
        type: "suggestion",
        fixable: "code",
        schema: [
            {
                type: "object",
                additionalProperties: false,
                properties: {},
            },
        ],
    },

    create(context) {
        const importerAbs = toRealPathIfExists(
            context.getFilename?.() ?? context.filename,
        );
        if (!path.isAbsolute(importerAbs)) return {};

        const settings = getSharedSettings(context);
        const projectRootAbs = toRealPathIfExists(
            "cwd" in context && typeof context.cwd === "string"
                ? context.cwd
                : process.cwd(),
        );
        const resolved = resolveRuleConfig({
            settings,
            projectRootAbs,
            importerAbs,
        });

        if (!resolved.config) {
            return {
                Program(node) {
                    reportInvalidOption({
                        context,
                        node,
                        error: resolved.error ?? "unknown error",
                    });
                },
            } satisfies Rule.RuleListener;
        }

        const config = resolved.config;
        if (config.aliasMappings.length === 0) {
            return {
                Program(node) {
                    reportInvalidOption({
                        context,
                        node,
                        error: "no compilerOptions.paths aliases resolve inside fsdRoot. Add a tsconfig path alias for the FSD root or set tsconfigPath.",
                    });
                },
            } satisfies Rule.RuleListener;
        }
        const rootImportPrefix = normalize(
            path.relative(projectRootAbs, config.fsdRootAbs),
        );
        const rootImportBaseAbs = projectRootAbs;
        const canMatchProjectRootImports =
            !rootImportPrefix || rootImportPrefix.startsWith("..");

        function checkNode(node: ImportLikeNode) {
            const sourceLit = getSourceLiteral(node);
            if (!sourceLit) return;

            const source = sourceLit.value as string;
            if (isAliasImport(source, config.aliasMappings)) return;
            if (isRelativeImport(source)) return;

            const matchesRootPrefix =
                !canMatchProjectRootImports &&
                source.startsWith(`${rootImportPrefix}/`);
            if (!(matchesRootPrefix || canMatchProjectRootImports)) return;

            const rootResolved = resolveBaseToExistingFile(
                path.resolve(rootImportBaseAbs, source),
                config.exts,
            );
            if (!rootResolved) return;
            if (!isWithinDir(rootResolved, config.fsdRootAbs)) return;

            const aliasSpecifier = getBestAliasSpecifierForTarget({
                targetAbs: rootResolved,
                aliasMappings: config.aliasMappings,
                fsdRootAbs: config.fsdRootAbs,
                rootAlias: config.rootAlias,
                aliasPreference: config.aliasPreference,
                exts: config.exts,
            });
            if (!aliasSpecifier) return;

            const aliasResolved = resolveToExistingFile({
                source: aliasSpecifier,
                importerAbs,
                aliasMappings: config.aliasMappings,
                exts: config.exts,
            });
            const fix =
                aliasResolved &&
                normalize(aliasResolved) === normalize(rootResolved)
                    ? (fixer: Rule.RuleFixer) =>
                          replaceSourceLiteral(sourceLit, aliasSpecifier, fixer)
                    : undefined;

            context.report({
                node,
                message: matchesRootPrefix
                    ? `Do not import from "${rootImportPrefix}/...". Use a configured alias such as "${aliasSpecifier}" instead.`
                    : `Do not import from project-root paths such as "${source}". Use a configured alias such as "${aliasSpecifier}" instead.`,
                fix,
            });
        }

        return {
            ImportDeclaration: checkNode,
            ExportNamedDeclaration: checkNode,
            ExportAllDeclaration: checkNode,
            ImportExpression: checkNode,
        } satisfies Rule.RuleListener;
    },
};

export default rule;
