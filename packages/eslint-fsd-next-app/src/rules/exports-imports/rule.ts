import fs from "node:fs";
import path from "node:path";
import type { Rule } from "eslint";
import type { Program } from "estree";
import {
    getBestAliasSpecifierForTarget,
    isAliasImport,
    resolveAliasBaseAbs,
} from "../../core/alias-utils.js";
import { resolveRuleConfig } from "../../core/config.js";
import type { ImportLikeNode } from "../../core/import-utils.js";
import {
    getSourceLiteral,
    isRelativeImport,
    replaceSourceLiteral,
    resolveToExistingFile,
} from "../../core/import-utils.js";
import {
    isCodeFile,
    isWithinDir,
    normalize,
    toRealPathIfExists,
} from "../../core/path-utils.js";
import { getSharedSettings } from "../../core/shared-settings.js";
import type { ResolvedRuleConfig } from "../../core/types.js";
import {
    getBoundaryDirAbs,
    getBoundaryInfo,
    getInternalContextInfo,
    toRelativeImport,
} from "./path-utils.js";
import {
    getBoundaryPublicApiFile,
    getTargetSlicePublicApiState,
} from "./resolution.js";
import { buildSameSlicePublicApiFix } from "./same-slice-public-api-fix.js";
import type { BoundaryInfo } from "./types.js";

function requiresPublicApi(
    boundary: {
        layer: string;
        kind: "slice" | "segment";
    },
    publicApiRequiredSegmentLayers: Set<string>,
) {
    return (
        boundary.kind === "slice" ||
        publicApiRequiredSegmentLayers.has(boundary.layer)
    );
}

function getBoundaryLabel(boundary: { kind: "slice" | "segment" }) {
    return boundary.kind === "segment" ? "segment" : "slice";
}

function getPublicApiLabel(boundary: { kind: "slice" | "segment" }) {
    return `${getBoundaryLabel(boundary)} public API`;
}

function getPublicApiRequirementMessage(
    boundary: {
        kind: "slice" | "segment";
    },
    publicApiFiles: string[],
) {
    return `${getBoundaryLabel(boundary)} must expose public API via ${publicApiFiles.join(", ")}.`;
}

function isSameBoundary(from: BoundaryInfo, to: BoundaryInfo) {
    return from.kind === "segment" && to.kind === "segment"
        ? from.layer === to.layer
        : from.layer === to.layer &&
              from.unit === to.unit &&
              from.kind === to.kind;
}

function reportBadRootOnce(params: {
    context: Rule.RuleContext;
    warned: { current: boolean };
    programNode: Program;
    fsdRoot: string;
    fsdRootAbs: string;
    details: string;
}) {
    if (params.warned.current) return;

    params.warned.current = true;
    params.context.report({
        node: params.programNode,
        message:
            `fsd/exports-imports invalid option: ${params.details} ` +
            `(fsdRoot="${params.fsdRoot}", resolved="${params.fsdRootAbs}")`,
    });
}

function checkOptionsAtStart(params: {
    context: Rule.RuleContext;
    programNode: Program;
    importerAbs: string;
    projectRootAbs: string;
    config: ResolvedRuleConfig;
}) {
    const warnedBadRoot = { current: false };
    const publicApiRequiredSegmentLayers = new Set(
        params.config.publicApiRequiredSegmentLayers,
    );

    try {
        if (!fs.existsSync(params.config.fsdRootAbs)) {
            reportBadRootOnce({
                context: params.context,
                warned: warnedBadRoot,
                programNode: params.programNode,
                fsdRoot: params.config.fsdRoot,
                fsdRootAbs: params.config.fsdRootAbs,
                details: "fsdRoot directory does not exist.",
            });
            return;
        }

        if (!fs.statSync(params.config.fsdRootAbs).isDirectory()) {
            reportBadRootOnce({
                context: params.context,
                warned: warnedBadRoot,
                programNode: params.programNode,
                fsdRoot: params.config.fsdRoot,
                fsdRootAbs: params.config.fsdRootAbs,
                details: "fsdRoot is not a directory.",
            });
            return;
        }
    } catch {
        reportBadRootOnce({
            context: params.context,
            warned: warnedBadRoot,
            programNode: params.programNode,
            fsdRoot: params.config.fsdRoot,
            fsdRootAbs: params.config.fsdRootAbs,
            details: "cannot access fsdRoot directory.",
        });
        return;
    }

    const sliceDirAbs = getBoundaryDirAbs(
        params.importerAbs,
        params.config.fsdRootAbs,
        params.config.sliceLayers,
        params.config.segmentLayers,
    );
    if (!sliceDirAbs) return;

    const currentBoundary = getBoundaryInfo(
        params.importerAbs,
        params.config.fsdRootAbs,
        params.config.sliceLayers,
        params.config.segmentLayers,
    );
    if (
        !(
            currentBoundary &&
            requiresPublicApi(currentBoundary, publicApiRequiredSegmentLayers)
        )
    ) {
        return;
    }

    const publicApiFileAbs = getBoundaryPublicApiFile(
        sliceDirAbs,
        params.config.publicApiFiles,
    );
    if (publicApiFileAbs) return;

    const relSliceDir = normalize(
        path.relative(params.projectRootAbs, sliceDirAbs),
    );

    params.context.report({
        node: params.programNode,
        message:
            `Boundary "${relSliceDir}" must expose public API via ` +
            `${params.config.publicApiFiles.join(", ")}.`,
    });
}

function checkImportNode(params: {
    context: Rule.RuleContext;
    node: ImportLikeNode;
    importerAbs: string;
    config: ResolvedRuleConfig;
}) {
    const publicApiRequiredSegmentLayers = new Set(
        params.config.publicApiRequiredSegmentLayers,
    );
    const sourceLit = getSourceLiteral(params.node);
    if (!sourceLit) return;

    const source = sourceLit.value as string;
    const targetFileAbs = resolveToExistingFile({
        source,
        importerAbs: params.importerAbs,
        aliasMappings: params.config.aliasMappings,
        exts: params.config.exts,
    });
    if (!targetFileAbs) return;
    if (!isWithinDir(targetFileAbs, params.config.fsdRootAbs)) return;

    const to =
        getBoundaryInfo(
            targetFileAbs,
            params.config.fsdRootAbs,
            params.config.sliceLayers,
            params.config.segmentLayers,
        ) ??
        getInternalContextInfo(
            targetFileAbs,
            params.config.fsdRootAbs,
            params.config.sliceLayers,
            params.config.segmentLayers,
        );
    if (!to) return;

    const aliasImport = isAliasImport(source, params.config.aliasMappings);
    const importerInFsd = isWithinDir(
        params.importerAbs,
        params.config.fsdRootAbs,
    );
    const from = importerInFsd
        ? getInternalContextInfo(
              params.importerAbs,
              params.config.fsdRootAbs,
              params.config.sliceLayers,
              params.config.segmentLayers,
          )
        : null;
    const targetIsCodeFile = isCodeFile(targetFileAbs, params.config.exts);

    if (!targetIsCodeFile) {
        if (!(aliasImport && from && isSameBoundary(from, to))) return;

        const relativeImport = toRelativeImport({
            importerAbs: params.importerAbs,
            targetFileAbs,
            exts: params.config.exts,
        });

        params.context.report({
            node: params.node,
            message:
                "Within the same boundary, use relative imports (no alias).",
            fix: fixer =>
                replaceSourceLiteral(sourceLit, relativeImport, fixer),
        });
        return;
    }

    const targetSlice = getTargetSlicePublicApiState({
        targetFileAbs,
        fsdRootAbs: params.config.fsdRootAbs,
        exts: params.config.exts,
        publicApiFiles: params.config.publicApiFiles,
        sliceLayers: params.config.sliceLayers,
        segmentLayers: params.config.segmentLayers,
    });

    if (
        targetSlice.sliceDirAbs &&
        !targetSlice.hasPublicApi &&
        requiresPublicApi(to, publicApiRequiredSegmentLayers)
    ) {
        params.context.report({
            node: params.node,
            message: getPublicApiRequirementMessage(
                to,
                params.config.publicApiFiles,
            ),
        });
    }

    const publicApiFileAbs = targetSlice.publicApiFileAbs;
    const preferredPublicApi =
        publicApiFileAbs &&
        getBestAliasSpecifierForTarget({
            targetAbs: publicApiFileAbs,
            aliasMappings: params.config.aliasMappings,
            fsdRootAbs: params.config.fsdRootAbs,
            rootAlias: params.config.rootAlias,
            aliasPreference: params.config.aliasPreference,
            exts: params.config.exts,
        });
    const aliasImportBaseAbs = aliasImport
        ? resolveAliasBaseAbs(source, params.config.aliasMappings)
        : null;
    const matchedPublicApiFileAbs =
        aliasImportBaseAbs &&
        targetSlice.publicApiImportTargetAbsList.length > 0
            ? (targetSlice.publicApiFileAbsList.find((candidate, index) => {
                  return (
                      normalize(aliasImportBaseAbs) ===
                      normalize(
                          targetSlice.publicApiImportTargetAbsList[index]!,
                      )
                  );
              }) ?? null)
            : null;
    const aliasBoundaryImport = !!matchedPublicApiFileAbs;
    const aliasBoundaryDirImport =
        !!(targetSlice.sliceDirAbs && aliasImportBaseAbs) &&
        !aliasBoundaryImport &&
        normalize(aliasImportBaseAbs) === normalize(targetSlice.sliceDirAbs);
    const matchedPreferredPublicApi =
        matchedPublicApiFileAbs &&
        getBestAliasSpecifierForTarget({
            targetAbs: matchedPublicApiFileAbs,
            aliasMappings: params.config.aliasMappings,
            fsdRootAbs: params.config.fsdRootAbs,
            rootAlias: params.config.rootAlias,
            aliasPreference: params.config.aliasPreference,
            exts: params.config.exts,
        });
    const aliasUsesPreferredPublicApi =
        !!matchedPreferredPublicApi &&
        aliasBoundaryImport &&
        source === matchedPreferredPublicApi;
    const aliasDeepImport =
        aliasImport && !aliasBoundaryImport && !aliasBoundaryDirImport;
    const aliasNonPreferredPublicApiImport =
        aliasBoundaryImport &&
        !!matchedPreferredPublicApi &&
        !aliasUsesPreferredPublicApi;

    if (!importerInFsd) {
        if (isRelativeImport(source)) {
            params.context.report({
                node: params.node,
                message:
                    "Importing into FSD from outside must use alias public API (no relative path).",
                fix:
                    targetSlice.hasPublicApi && preferredPublicApi
                        ? fixer =>
                              replaceSourceLiteral(
                                  sourceLit,
                                  preferredPublicApi,
                                  fixer,
                              )
                        : undefined,
            });
            return;
        }

        if (aliasNonPreferredPublicApiImport) {
            params.context.report({
                node: params.node,
                message: `Importing into FSD from outside must use the preferred ${getPublicApiLabel(to)} import.`,
                fix: fixer =>
                    replaceSourceLiteral(
                        sourceLit,
                        matchedPreferredPublicApi!,
                        fixer,
                    ),
            });
            return;
        }

        if (aliasBoundaryDirImport) {
            if (!targetSlice.hasPublicApi) return;

            params.context.report({
                node: params.node,
                message: `Importing into FSD from outside must use the preferred ${getPublicApiLabel(to)} import.`,
                fix: fixer =>
                    replaceSourceLiteral(sourceLit, preferredPublicApi!, fixer),
            });
            return;
        }

        if (aliasDeepImport) {
            params.context.report({
                node: params.node,
                message: `Importing into FSD from outside must use ${getPublicApiLabel(to)} only (no deep import).`,
                fix:
                    targetSlice.hasPublicApi && preferredPublicApi
                        ? fixer =>
                              replaceSourceLiteral(
                                  sourceLit,
                                  preferredPublicApi,
                                  fixer,
                              )
                        : undefined,
            });
        }

        return;
    }

    if (!from) {
        if (isRelativeImport(source)) {
            params.context.report({
                node: params.node,
                message:
                    "Imports from FSD non-slice files must use alias public API (no relative path).",
                fix:
                    targetSlice.hasPublicApi && preferredPublicApi
                        ? fixer =>
                              replaceSourceLiteral(
                                  sourceLit,
                                  preferredPublicApi,
                                  fixer,
                              )
                        : undefined,
            });
            return;
        }

        if (aliasNonPreferredPublicApiImport) {
            params.context.report({
                node: params.node,
                message: `Imports from FSD non-boundary files must use the preferred ${getPublicApiLabel(to)} import.`,
                fix: fixer =>
                    replaceSourceLiteral(
                        sourceLit,
                        matchedPreferredPublicApi!,
                        fixer,
                    ),
            });
            return;
        }

        if (aliasBoundaryDirImport) {
            if (!targetSlice.hasPublicApi) return;

            params.context.report({
                node: params.node,
                message: `Imports from FSD non-boundary files must use the preferred ${getPublicApiLabel(to)} import.`,
                fix: fixer =>
                    replaceSourceLiteral(sourceLit, preferredPublicApi!, fixer),
            });
            return;
        }

        if (aliasDeepImport) {
            params.context.report({
                node: params.node,
                message: `Imports from FSD non-boundary files must use ${getPublicApiLabel(to)} only (no deep import).`,
                fix:
                    targetSlice.hasPublicApi && preferredPublicApi
                        ? fixer =>
                              replaceSourceLiteral(
                                  sourceLit,
                                  preferredPublicApi,
                                  fixer,
                              )
                        : undefined,
            });
        }

        return;
    }

    const sameBoundary = isSameBoundary(from, to);
    if (sameBoundary) {
        const targetsBoundaryBarrelFile =
            aliasBoundaryDirImport &&
            normalize(params.importerAbs) !== normalize(targetFileAbs);
        const targetsBoundaryPublicApiFile =
            targetSlice.publicApiFileAbsList.some(
                candidate =>
                    normalize(targetFileAbs) === normalize(candidate) &&
                    normalize(params.importerAbs) !== normalize(candidate),
            );

        if (targetsBoundaryPublicApiFile || targetsBoundaryBarrelFile) {
            const fix =
                params.node.type === "ImportDeclaration"
                    ? (buildSameSlicePublicApiFix({
                          node: params.node,
                          importerAbs: params.importerAbs,
                          barrelFileAbs: targetFileAbs,
                          sourceLit,
                          context: params.context,
                          options: {
                              aliasMappings: params.config.aliasMappings,
                              exts: params.config.exts,
                          },
                      }) ?? undefined)
                    : undefined;

            params.context.report({
                node: params.node,
                message: targetsBoundaryPublicApiFile
                    ? `Within the same ${getBoundaryLabel(to)}, do not import through the ${getPublicApiLabel(to)} file. Import the actual module by relative path.`
                    : `Within the same ${getBoundaryLabel(to)}, do not import through a barrel file. Import the actual module by relative path.`,
                fix,
            });
            return;
        }

        if (aliasImport) {
            const relativeImport = toRelativeImport({
                importerAbs: params.importerAbs,
                targetFileAbs,
                exts: params.config.exts,
            });

            params.context.report({
                node: params.node,
                message:
                    "Within the same boundary, use relative imports (no alias).",
                fix: fixer =>
                    replaceSourceLiteral(sourceLit, relativeImport, fixer),
            });
        }
        return;
    }

    if (isRelativeImport(source)) {
        params.context.report({
            node: params.node,
            message: `Cross-${getBoundaryLabel(to)} imports must use alias ${getPublicApiLabel(to)} (directory import).`,
            fix:
                targetSlice.hasPublicApi && preferredPublicApi
                    ? fixer =>
                          replaceSourceLiteral(
                              sourceLit,
                              preferredPublicApi,
                              fixer,
                          )
                    : undefined,
        });
        return;
    }

    if (aliasNonPreferredPublicApiImport) {
        params.context.report({
            node: params.node,
            message: `Cross-${getBoundaryLabel(to)} imports must use the preferred ${getPublicApiLabel(to)} import.`,
            fix: fixer =>
                replaceSourceLiteral(
                    sourceLit,
                    matchedPreferredPublicApi!,
                    fixer,
                ),
        });
        return;
    }

    if (aliasBoundaryDirImport) {
        if (!targetSlice.hasPublicApi) return;

        params.context.report({
            node: params.node,
            message: `Cross-${getBoundaryLabel(to)} imports must use the preferred ${getPublicApiLabel(to)} import.`,
            fix: fixer =>
                replaceSourceLiteral(sourceLit, preferredPublicApi!, fixer),
        });
        return;
    }

    if (aliasDeepImport) {
        params.context.report({
            node: params.node,
            message: `Do not deep-import across ${getBoundaryLabel(to)}s. Import from the ${getPublicApiLabel(to)} only.`,
            fix:
                targetSlice.hasPublicApi && preferredPublicApi
                    ? fixer =>
                          replaceSourceLiteral(
                              sourceLit,
                              preferredPublicApi,
                              fixer,
                          )
                    : undefined,
        });
    }
}

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
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
                    context.report({
                        node,
                        message: `fsd/exports-imports invalid option: ${resolved.error}`,
                    });
                },
            } satisfies Rule.RuleListener;
        }

        const config = resolved.config;
        if (config.aliasMappings.length === 0) {
            return {
                Program(node) {
                    context.report({
                        node,
                        message:
                            "fsd/exports-imports invalid option: no compilerOptions.paths aliases resolve inside fsdRoot. Add a tsconfig path alias for the FSD root or set tsconfigPath.",
                    });
                },
            } satisfies Rule.RuleListener;
        }

        return {
            Program(node) {
                checkOptionsAtStart({
                    context,
                    programNode: node,
                    importerAbs,
                    projectRootAbs,
                    config,
                });
            },
            ImportDeclaration(node) {
                checkImportNode({
                    context,
                    node,
                    importerAbs,
                    config,
                });
            },
            ExportNamedDeclaration(node) {
                checkImportNode({
                    context,
                    node,
                    importerAbs,
                    config,
                });
            },
            ExportAllDeclaration(node) {
                checkImportNode({
                    context,
                    node,
                    importerAbs,
                    config,
                });
            },
            ImportExpression(node) {
                checkImportNode({
                    context,
                    node,
                    importerAbs,
                    config,
                });
            },
        } satisfies Rule.RuleListener;
    },
};

export default rule;
