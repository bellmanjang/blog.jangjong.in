import path from "node:path";
import { isIndexFile, normalize, stripKnownExt } from "./path-utils.js";

export function getResolvedPublicApiFiles(
    publicApiFiles: string[] | undefined,
    exts: string[],
) {
    const candidates = publicApiFiles?.length
        ? publicApiFiles
        : exts.map(ext => `index${ext}`);

    const unique = new Set<string>();
    const resolved: string[] = [];

    for (const fileName of candidates) {
        if (!fileName) continue;
        if (unique.has(fileName)) continue;
        unique.add(fileName);
        resolved.push(fileName);
    }

    return resolved;
}

export function getPublicApiImportTargetAbs(
    publicApiFileAbs: string,
    exts: string[],
) {
    return normalize(
        isIndexFile(publicApiFileAbs, exts)
            ? path.dirname(publicApiFileAbs)
            : stripKnownExt(publicApiFileAbs, exts),
    );
}
