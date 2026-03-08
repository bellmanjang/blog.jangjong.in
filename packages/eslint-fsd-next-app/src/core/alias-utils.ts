import path from "node:path";
import {
    isIndexFile,
    isWithinDir,
    normalize,
    stripKnownExt,
} from "./path-utils.js";
import type { AliasMapping } from "./types.js";

function compareAliasMatch(left: AliasMapping, right: AliasMapping) {
    const aliasLengthDiff = right.alias.length - left.alias.length;
    if (aliasLengthDiff !== 0) return aliasLengthDiff;

    const targetDepthDiff =
        normalize(right.targetRootAbs).length -
        normalize(left.targetRootAbs).length;
    if (targetDepthDiff !== 0) return targetDepthDiff;

    return left.order - right.order;
}

function compareAliasSpecifierCandidate(
    left: {
        mapping: AliasMapping;
        specifier: string;
    },
    right: {
        mapping: AliasMapping;
        specifier: string;
    },
) {
    const targetDepthDiff =
        normalize(right.mapping.targetRootAbs).length -
        normalize(left.mapping.targetRootAbs).length;
    if (targetDepthDiff !== 0) return targetDepthDiff;

    const specifierLengthDiff = left.specifier.length - right.specifier.length;
    if (specifierLengthDiff !== 0) return specifierLengthDiff;

    return left.mapping.order - right.mapping.order;
}

function toAliasSpecifier(params: {
    alias: string;
    targetRootAbs: string;
    targetAbs: string;
    exts: string[];
}) {
    const rel = normalize(
        path.relative(params.targetRootAbs, params.targetAbs),
    );
    return rel
        ? `${params.alias}/${stripKnownExt(rel, params.exts)}`
        : params.alias;
}

export type AliasMatch = {
    mapping: AliasMapping;
    remainder: string;
    baseAbs: string;
};

export function dedupeAliasMappings(
    aliasMappings: AliasMapping[],
): AliasMapping[] {
    const seen = new Set<string>();
    const deduped: AliasMapping[] = [];

    for (const mapping of aliasMappings) {
        const key = `${mapping.alias}::${normalize(mapping.targetRootAbs)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push({
            ...mapping,
            targetRootAbs: normalize(mapping.targetRootAbs),
        });
    }

    return deduped;
}

export function matchAliasSpecifier(
    source: string,
    aliasMappings: AliasMapping[],
): AliasMatch | null {
    const matches = aliasMappings
        .filter(
            mapping =>
                source === mapping.alias ||
                source.startsWith(`${mapping.alias}/`),
        )
        .sort(compareAliasMatch);

    const [mapping] = matches;
    if (!mapping) return null;

    const remainder =
        source === mapping.alias ? "" : source.slice(mapping.alias.length + 1);

    return {
        mapping,
        remainder,
        baseAbs: normalize(path.resolve(mapping.targetRootAbs, remainder)),
    };
}

export function isAliasImport(source: string, aliasMappings: AliasMapping[]) {
    return !!matchAliasSpecifier(source, aliasMappings);
}

export function resolveAliasBaseAbs(
    source: string,
    aliasMappings: AliasMapping[],
): string | null {
    return matchAliasSpecifier(source, aliasMappings)?.baseAbs ?? null;
}

export function getBestAliasSpecifierForTarget(params: {
    targetAbs: string;
    aliasMappings: AliasMapping[];
    fsdRootAbs: string;
    rootAlias: string | null;
    aliasPreference: "root" | "most-specific";
    exts: string[];
}): string | null {
    const baseTargetAbs = isIndexFile(params.targetAbs, params.exts)
        ? path.dirname(params.targetAbs)
        : params.targetAbs;
    const normalizedTargetAbs = normalize(baseTargetAbs);

    if (
        params.aliasPreference === "root" &&
        params.rootAlias &&
        isWithinDir(normalizedTargetAbs, params.fsdRootAbs)
    ) {
        return toAliasSpecifier({
            alias: params.rootAlias,
            targetRootAbs: params.fsdRootAbs,
            targetAbs: normalizedTargetAbs,
            exts: params.exts,
        });
    }

    const candidates = params.aliasMappings
        .filter(mapping =>
            isWithinDir(normalizedTargetAbs, mapping.targetRootAbs),
        )
        .map(mapping => ({
            mapping,
            specifier: toAliasSpecifier({
                alias: mapping.alias,
                targetRootAbs: mapping.targetRootAbs,
                targetAbs: normalizedTargetAbs,
                exts: params.exts,
            }),
        }))
        .sort(compareAliasSpecifierCandidate);

    return candidates[0]?.specifier ?? null;
}

export function isAliasBoundaryImport(params: {
    source: string;
    aliasMappings: AliasMapping[];
    boundaryDirAbs: string;
}) {
    const baseAbs = resolveAliasBaseAbs(params.source, params.aliasMappings);
    if (!baseAbs) return false;

    return normalize(baseAbs) === normalize(params.boundaryDirAbs);
}
