import path from "node:path";
import {
    isIndexFile,
    normalize,
    stripKnownExt,
} from "../../core/path-utils.js";
import type { BoundaryInfo } from "./types.js";

function getBoundaryKind(params: {
    layer: string;
    sliceLayers?: string[];
    segmentLayers?: string[];
}) {
    if (params.segmentLayers?.includes(params.layer)) return "segment";
    if (params.sliceLayers?.includes(params.layer)) return "slice";
    return null;
}

export function getInternalContextInfo(
    absFile: string,
    fsdRootAbs: string,
    sliceLayers?: string[],
    segmentLayers?: string[],
): BoundaryInfo | null {
    const rel = normalize(path.relative(fsdRootAbs, absFile));
    if (rel.startsWith("..") || path.isAbsolute(rel)) return null;

    const parts = rel.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const [layer, unit = ""] = parts;
    if (!layer) return null;

    const kind = getBoundaryKind({
        layer,
        sliceLayers,
        segmentLayers,
    });
    if (!kind) return null;

    if (kind === "slice" && parts.length < 3) return null;

    return { layer, unit, kind };
}

export function getBoundaryInfo(
    absFile: string,
    fsdRootAbs: string,
    sliceLayers?: string[],
    segmentLayers?: string[],
): BoundaryInfo | null {
    const rel = normalize(path.relative(fsdRootAbs, absFile));
    if (rel.startsWith("..") || path.isAbsolute(rel)) return null;

    const parts = rel.split("/").filter(Boolean);
    if (parts.length < 3) return null;

    const [layer, unit] = parts;
    if (!(layer && unit)) return null;

    const kind = getBoundaryKind({
        layer,
        sliceLayers,
        segmentLayers,
    });
    if (!kind) return null;

    return { layer, unit, kind };
}

export function getBoundaryDirAbs(
    absFile: string,
    fsdRootAbs: string,
    sliceLayers?: string[],
    segmentLayers?: string[],
): string | null {
    const info = getBoundaryInfo(
        absFile,
        fsdRootAbs,
        sliceLayers,
        segmentLayers,
    );
    if (!info) return null;

    return path.join(fsdRootAbs, info.layer, info.unit);
}

export function toRelativeImport(params: {
    importerAbs: string;
    targetFileAbs: string;
    exts: string[];
}): string {
    const importerDir = path.dirname(params.importerAbs);
    const baseTarget = isIndexFile(params.targetFileAbs, params.exts)
        ? path.dirname(params.targetFileAbs)
        : params.targetFileAbs;

    let rel = path.relative(importerDir, baseTarget);
    if (rel === "") rel = ".";
    if (!rel.startsWith(".")) rel = `./${rel}`;

    return normalize(stripKnownExt(rel, params.exts));
}
