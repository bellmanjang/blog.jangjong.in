import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { dedupeAliasMappings } from "./alias-utils.js";
import {
    DEFAULT_EXTS,
    DEFAULT_PUBLIC_API_REQUIRED_SEGMENT_LAYERS,
    DEFAULT_SEGMENT_LAYERS,
    DEFAULT_SLICE_LAYERS,
} from "./constants.js";
import {
    getPathStamp,
    isWithinDir,
    normalize,
    toRealPathIfExists,
} from "./path-utils.js";
import { getResolvedPublicApiFiles } from "./public-api-utils.js";
import type {
    AliasMapping,
    ResolvedRuleConfig,
    SharedSettings,
} from "./types.js";

type InferredConfig = {
    fsdRoot: string;
    fsdRootAbs: string;
    rootAlias: string | null;
    aliasMappings: AliasMapping[];
};

type InferenceResult =
    | { config: InferredConfig; error: null }
    | { config: null; error: string };

type ParsedTsConfig = {
    baseUrlAbs: string;
    paths: Record<string, string[]> | null;
    error: string | null;
};

type NearestTsconfigCacheEntry = {
    tsconfigAbs: string | null;
    dirStamps: Map<string, string | null>;
};

function haveStampsChanged(stamps: Map<string, string | null>) {
    for (const [targetAbs, stamp] of stamps.entries()) {
        if (getPathStamp(targetAbs) !== stamp) return true;
    }

    return false;
}

function createStampMap(targets: string[]) {
    return new Map(targets.map(target => [target, getPathStamp(target)]));
}

const nearestTsconfigCache = new Map<string, NearestTsconfigCacheEntry>();

function findNearestTsconfig(startAbs: string): string | null {
    const startDir = path.dirname(startAbs);
    const cached = nearestTsconfigCache.get(startDir);
    if (cached && !haveStampsChanged(cached.dirStamps)) {
        return cached.tsconfigAbs;
    }

    let current = startDir;
    const scannedDirs: string[] = [];

    while (true) {
        scannedDirs.push(current);
        const candidate = path.join(current, "tsconfig.json");
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            const tsconfigAbs = toRealPathIfExists(candidate);
            nearestTsconfigCache.set(startDir, {
                tsconfigAbs,
                dirStamps: createStampMap(scannedDirs),
            });
            return tsconfigAbs;
        }

        const parent = path.dirname(current);
        if (parent === current) {
            nearestTsconfigCache.set(startDir, {
                tsconfigAbs: null,
                dirStamps: createStampMap(scannedDirs),
            });
            return null;
        }
        current = parent;
    }
}

function formatDiagnosticMessage(diagnostic: ts.Diagnostic) {
    return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}

type CachedTsConfig = ParsedTsConfig & {
    sourceStamps: Map<string, string | null>;
};

function getResolvedBaseUrlAbs(baseDir: string, baseUrl: string | undefined) {
    if (!baseUrl) return baseDir;

    return toRealPathIfExists(
        path.isAbsolute(baseUrl) ? baseUrl : path.resolve(baseDir, baseUrl),
    );
}

const tsconfigCache = new Map<string, CachedTsConfig>();

function readTsconfig(tsconfigAbs: string): ParsedTsConfig {
    const normalizedTsconfigAbs = toRealPathIfExists(tsconfigAbs);
    const cached = tsconfigCache.get(normalizedTsconfigAbs);
    if (cached && !haveStampsChanged(cached.sourceStamps)) return cached;

    const baseDir = path.dirname(normalizedTsconfigAbs);
    const sourceFiles = new Set<string>([normalizedTsconfigAbs]);
    let fatalDiagnostic: ts.Diagnostic | null = null;

    const host: ts.ParseConfigFileHost = {
        ...ts.sys,
        useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
        readDirectory: ts.sys.readDirectory,
        fileExists: ts.sys.fileExists,
        readFile(fileName) {
            sourceFiles.add(toRealPathIfExists(fileName));
            return ts.sys.readFile(fileName);
        },
        onUnRecoverableConfigFileDiagnostic(diagnostic) {
            fatalDiagnostic = diagnostic;
        },
    };

    const parsed = ts.getParsedCommandLineOfConfigFile(
        normalizedTsconfigAbs,
        undefined,
        host,
    );

    if (!parsed) {
        const result: CachedTsConfig = {
            baseUrlAbs: baseDir,
            paths: null,
            error: fatalDiagnostic
                ? formatDiagnosticMessage(fatalDiagnostic)
                : "Could not parse tsconfig.",
            sourceStamps: createStampMap([...sourceFiles]),
        };
        tsconfigCache.set(normalizedTsconfigAbs, result);
        return result;
    }

    const baseUrlAbs = getResolvedBaseUrlAbs(baseDir, parsed.options.baseUrl);
    const paths = parsed.options.paths ?? null;

    if (!paths && parsed.errors.length > 0) {
        const result: CachedTsConfig = {
            baseUrlAbs,
            paths: null,
            error: formatDiagnosticMessage(parsed.errors[0]!),
            sourceStamps: createStampMap([...sourceFiles]),
        };
        tsconfigCache.set(normalizedTsconfigAbs, result);
        return result;
    }

    const result: CachedTsConfig = {
        baseUrlAbs,
        paths,
        error: null,
        sourceStamps: createStampMap([...sourceFiles]),
    };
    tsconfigCache.set(normalizedTsconfigAbs, result);
    return result;
}

function stripTrailingWildcard(value: string): string {
    if (value.endsWith("/*")) return value.slice(0, -2);
    return value;
}

function stripAliasWildcard(value: string): string {
    if (value.endsWith("/*")) return value.slice(0, -2);
    if (value.endsWith("/")) return value.slice(0, -1);
    return value;
}

function getPathDepthFrom(rootAbs: string, targetAbs: string): number {
    const rel = normalize(path.relative(rootAbs, targetAbs));
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return 0;
    return rel.split("/").filter(Boolean).length;
}

function getImporterLayerMatch(params: {
    importerAbs: string;
    fsdRootAbs: string;
    knownLayers: Set<string>;
}): number {
    const rel = normalize(path.relative(params.fsdRootAbs, params.importerAbs));
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return 0;

    const [firstPart] = rel.split("/").filter(Boolean);
    return firstPart && params.knownLayers.has(firstPart) ? 1 : 0;
}

function countExistingLayerDirs(
    rootAbs: string,
    knownLayers: Set<string>,
): number {
    let count = 0;

    for (const layer of knownLayers) {
        try {
            const layerAbs = path.join(rootAbs, layer);
            if (
                fs.existsSync(layerAbs) &&
                fs.statSync(layerAbs).isDirectory()
            ) {
                count += 1;
            }
        } catch {}
    }

    return count;
}

function compareScore(left: number[], right: number[]) {
    for (
        let index = 0;
        index < Math.max(left.length, right.length);
        index += 1
    ) {
        const leftValue = left[index] ?? 0;
        const rightValue = right[index] ?? 0;
        if (leftValue === rightValue) continue;
        return leftValue - rightValue;
    }

    return 0;
}

function getPreferredRootAlias(params: {
    aliasMappings: AliasMapping[];
    fsdRootAbs: string;
}) {
    const rootMappings = params.aliasMappings
        .filter(
            mapping =>
                normalize(mapping.targetRootAbs) ===
                normalize(params.fsdRootAbs),
        )
        .sort((left, right) => {
            const aliasPreferenceDiff =
                (right.alias === "@" ? 1 : 0) - (left.alias === "@" ? 1 : 0);
            if (aliasPreferenceDiff !== 0) return aliasPreferenceDiff;

            const aliasLengthDiff = left.alias.length - right.alias.length;
            if (aliasLengthDiff !== 0) return aliasLengthDiff;

            return left.order - right.order;
        });

    return rootMappings[0]?.alias ?? null;
}

function getTsconfigPath(params: {
    projectRootAbs: string;
    importerAbs: string;
    tsconfigPath?: string;
}) {
    return params.tsconfigPath
        ? toRealPathIfExists(
              path.resolve(params.projectRootAbs, params.tsconfigPath),
          )
        : (findNearestTsconfig(params.importerAbs) ??
              path.join(params.projectRootAbs, "tsconfig.json"));
}

function readTsconfigAliasMappings(params: {
    projectRootAbs: string;
    importerAbs: string;
    tsconfigPath?: string;
}): {
    aliasMappings: AliasMapping[] | null;
    error: string | null;
} {
    const tsconfigAbs = getTsconfigPath(params);

    if (!(fs.existsSync(tsconfigAbs) && fs.statSync(tsconfigAbs).isFile())) {
        return {
            aliasMappings: null,
            error: `Could not find tsconfig at "${normalize(path.relative(params.projectRootAbs, tsconfigAbs))}".`,
        };
    }

    const tsconfig = readTsconfig(tsconfigAbs);
    if (!tsconfig.paths) {
        return {
            aliasMappings: null,
            error:
                tsconfig.error ??
                "tsconfig does not define compilerOptions.paths.",
        };
    }

    let order = 0;
    const aliasMappings: AliasMapping[] = [];

    for (const [aliasPattern, targets] of Object.entries(tsconfig.paths)) {
        if (!targets?.length) continue;

        const alias = stripAliasWildcard(aliasPattern);
        if (!alias) continue;

        for (const targetPattern of targets) {
            const targetRoot = stripTrailingWildcard(targetPattern);
            const targetRootAbs = toRealPathIfExists(
                path.resolve(tsconfig.baseUrlAbs, targetRoot),
            );

            if (
                !(
                    fs.existsSync(targetRootAbs) &&
                    fs.statSync(targetRootAbs).isDirectory()
                )
            ) {
                continue;
            }

            aliasMappings.push({
                alias,
                targetRootAbs,
                order,
            });
            order += 1;
        }
    }

    return {
        aliasMappings: dedupeAliasMappings(aliasMappings),
        error: null,
    };
}

function inferFromTsconfig(params: {
    projectRootAbs: string;
    importerAbs: string;
    tsconfigPath?: string;
    sliceLayers: string[];
    segmentLayers: string[];
}): InferenceResult {
    const tsconfigAliases = readTsconfigAliasMappings(params);
    if (!tsconfigAliases.aliasMappings) {
        return {
            config: null,
            error:
                tsconfigAliases.error ??
                "Could not infer aliases from tsconfig paths.",
        };
    }

    const knownLayers = new Set([
        ...params.sliceLayers,
        ...params.segmentLayers,
    ]);
    const candidates = new Map<
        string,
        Pick<InferredConfig, "fsdRoot" | "fsdRootAbs"> & { score: number[] }
    >();

    for (const mapping of tsconfigAliases.aliasMappings) {
        const fsdRootAbs = mapping.targetRootAbs;
        const fsdRoot = normalize(
            path.relative(params.projectRootAbs, fsdRootAbs),
        );
        const key = fsdRootAbs;
        if (candidates.has(key)) continue;

        candidates.set(key, {
            fsdRoot,
            fsdRootAbs,
            score: [
                getImporterLayerMatch({
                    importerAbs: params.importerAbs,
                    fsdRootAbs,
                    knownLayers,
                }),
                countExistingLayerDirs(fsdRootAbs, knownLayers),
                path.basename(fsdRootAbs) === "src" ? 1 : 0,
                getPathDepthFrom(params.projectRootAbs, fsdRootAbs),
            ],
        });
    }

    const rankedCandidates = [...candidates.values()].sort((left, right) => {
        return compareScore(right.score, left.score);
    });

    const [bestCandidate] = rankedCandidates;
    if (!bestCandidate) {
        return {
            config: null,
            error: "Could not infer fsdRoot from tsconfig paths.",
        };
    }

    const ambiguousCandidate = rankedCandidates.find(candidate => {
        if (candidate === bestCandidate) return false;
        return compareScore(candidate.score, bestCandidate.score) === 0;
    });

    if (ambiguousCandidate) {
        return {
            config: null,
            error: "Could not infer fsdRoot from tsconfig paths unambiguously. Set it explicitly.",
        };
    }

    const aliasMappings = dedupeAliasMappings(
        tsconfigAliases.aliasMappings.filter(mapping =>
            isWithinDir(mapping.targetRootAbs, bestCandidate.fsdRootAbs),
        ),
    );

    return {
        config: {
            fsdRoot: bestCandidate.fsdRoot,
            fsdRootAbs: bestCandidate.fsdRootAbs,
            rootAlias: getPreferredRootAlias({
                aliasMappings,
                fsdRootAbs: bestCandidate.fsdRootAbs,
            }),
            aliasMappings,
        },
        error: null,
    };
}

export function resolveRuleConfig(params: {
    settings: SharedSettings;
    projectRootAbs: string;
    importerAbs: string;
}): { config: ResolvedRuleConfig | null; error: string | null } {
    const projectRootAbs = toRealPathIfExists(params.projectRootAbs);
    const importerAbs = toRealPathIfExists(params.importerAbs);
    const exts = params.settings["fsd-exts"]?.length
        ? params.settings["fsd-exts"]
        : DEFAULT_EXTS;
    const publicApiFiles = getResolvedPublicApiFiles(
        params.settings["fsd-public-api-files"],
        exts,
    );
    const publicApiRequiredSegmentLayers = params.settings[
        "fsd-public-api-required-segment-layers"
    ]?.length
        ? params.settings["fsd-public-api-required-segment-layers"]
        : DEFAULT_PUBLIC_API_REQUIRED_SEGMENT_LAYERS;
    const aliasPreference =
        params.settings["fsd-alias-preference"] ?? "most-specific";
    const rawSliceLayers = params.settings["fsd-slice-layers"]?.length
        ? params.settings["fsd-slice-layers"]
        : DEFAULT_SLICE_LAYERS;
    const segmentLayers = params.settings["fsd-segment-layers"]?.length
        ? params.settings["fsd-segment-layers"]
        : DEFAULT_SEGMENT_LAYERS;
    const segmentLayerSet = new Set(segmentLayers);
    const sliceLayers = rawSliceLayers.filter(
        layer => !segmentLayerSet.has(layer),
    );

    const explicitRoot =
        typeof params.settings["fsd-root"] === "string" &&
        params.settings["fsd-root"].length > 0
            ? params.settings["fsd-root"]
            : null;

    if (explicitRoot) {
        const fsdRootAbs = path.isAbsolute(explicitRoot)
            ? toRealPathIfExists(explicitRoot)
            : toRealPathIfExists(path.resolve(projectRootAbs, explicitRoot));
        const tsconfigAliases = readTsconfigAliasMappings({
            projectRootAbs,
            importerAbs,
            tsconfigPath: params.settings["fsd-tsconfig-path"],
        });
        const aliasMappings = dedupeAliasMappings(
            (tsconfigAliases.aliasMappings ?? []).filter(mapping =>
                isWithinDir(mapping.targetRootAbs, fsdRootAbs),
            ),
        );

        return {
            config: {
                fsdRoot: explicitRoot,
                fsdRootAbs,
                rootAlias: getPreferredRootAlias({
                    aliasMappings,
                    fsdRootAbs,
                }),
                aliasMappings,
                aliasPreference,
                exts,
                publicApiFiles,
                publicApiRequiredSegmentLayers,
                sliceLayers,
                segmentLayers,
            },
            error: null,
        };
    }

    const inferred = inferFromTsconfig({
        projectRootAbs,
        importerAbs,
        tsconfigPath: params.settings["fsd-tsconfig-path"],
        sliceLayers,
        segmentLayers,
    });

    if (!inferred.config) {
        return {
            config: null,
            error:
                inferred.error ??
                "Could not infer fsdRoot from tsconfig paths. Set fsdRoot explicitly or provide tsconfigPath.",
        };
    }

    return {
        config: {
            fsdRoot: inferred.config.fsdRoot,
            fsdRootAbs: inferred.config.fsdRootAbs,
            rootAlias: inferred.config.rootAlias,
            aliasMappings: inferred.config.aliasMappings,
            aliasPreference,
            exts,
            publicApiFiles,
            publicApiRequiredSegmentLayers,
            sliceLayers,
            segmentLayers,
        },
        error: null,
    };
}
