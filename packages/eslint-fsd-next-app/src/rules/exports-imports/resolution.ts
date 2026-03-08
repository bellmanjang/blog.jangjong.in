import fs from "node:fs";
import path from "node:path";
import { getPathStamp, normalize } from "../../core/path-utils.js";
import { getPublicApiImportTargetAbs } from "../../core/public-api-utils.js";
import { getBoundaryDirAbs } from "./path-utils.js";

type PublicApiCacheEntry = {
    dirStamp: string | null;
    result: string[];
};

const publicApiCache = new Map<string, PublicApiCacheEntry>();

function getPublicApiFilesCacheKey(publicApiFiles: string[]) {
    return publicApiFiles.join("|");
}

export function getBoundaryPublicApiFiles(
    boundaryDirAbs: string,
    publicApiFiles: string[],
): string[] {
    const cacheKey = `${normalize(boundaryDirAbs)}::${getPublicApiFilesCacheKey(publicApiFiles)}`;
    const dirStamp = getPathStamp(boundaryDirAbs);
    const cached = publicApiCache.get(cacheKey);
    if (cached && cached.dirStamp === dirStamp) {
        return cached.result;
    }

    const result: string[] = [];
    for (const publicApiFile of publicApiFiles) {
        const publicApiFileAbs = path.join(boundaryDirAbs, publicApiFile);
        if (
            fs.existsSync(publicApiFileAbs) &&
            fs.statSync(publicApiFileAbs).isFile()
        ) {
            result.push(publicApiFileAbs);
        }
    }

    publicApiCache.set(cacheKey, { dirStamp, result });
    return result;
}

export function getBoundaryPublicApiFile(
    boundaryDirAbs: string,
    publicApiFiles: string[],
): string | null {
    return getBoundaryPublicApiFiles(boundaryDirAbs, publicApiFiles)[0] ?? null;
}

export function getTargetSlicePublicApiState(params: {
    targetFileAbs: string;
    fsdRootAbs: string;
    exts: string[];
    publicApiFiles: string[];
    sliceLayers: string[];
    segmentLayers: string[];
}) {
    const sliceDirAbs = getBoundaryDirAbs(
        params.targetFileAbs,
        params.fsdRootAbs,
        params.sliceLayers,
        params.segmentLayers,
    );
    const publicApiFileAbsList = sliceDirAbs
        ? getBoundaryPublicApiFiles(sliceDirAbs, params.publicApiFiles)
        : [];
    const publicApiFileAbs = publicApiFileAbsList[0] ?? null;
    const hasPublicApi = publicApiFileAbsList.length > 0;

    return {
        sliceDirAbs,
        publicApiFileAbs,
        publicApiFileAbsList,
        publicApiImportTargetAbs: publicApiFileAbs
            ? getPublicApiImportTargetAbs(publicApiFileAbs, params.exts)
            : null,
        publicApiImportTargetAbsList: publicApiFileAbsList.map(publicApiFile =>
            getPublicApiImportTargetAbs(publicApiFile, params.exts),
        ),
        hasPublicApi,
    };
}
