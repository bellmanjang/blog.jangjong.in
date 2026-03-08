import fs from "node:fs";
import path from "node:path";

export function toRealPathIfExists(filePath: string): string {
    try {
        return path.normalize(fs.realpathSync(filePath));
    } catch {
        return path.normalize(filePath);
    }
}

export function normalize(filePath: string): string {
    return filePath.replace(/\\/g, "/");
}

export function getPathStamp(filePath: string): string | null {
    try {
        const stat = fs.statSync(filePath);
        const kind = stat.isDirectory() ? "dir" : "file";
        return `${kind}:${stat.mtimeMs}:${stat.size}`;
    } catch {
        return null;
    }
}

export function isWithinDir(childAbs: string, parentAbs: string): boolean {
    const rel = path.relative(parentAbs, childAbs);
    return rel === "" || !(rel.startsWith("..") || path.isAbsolute(rel));
}

export function isCodeFile(fileAbs: string, exts: string[]): boolean {
    return exts.some(ext => fileAbs.endsWith(ext));
}

export function stripKnownExt(fileOrPath: string, exts: string[]): string {
    for (const ext of exts) {
        if (fileOrPath.endsWith(ext)) {
            return fileOrPath.slice(0, -ext.length);
        }
    }

    return fileOrPath;
}

export function isIndexFile(fileAbs: string, exts: string[]): boolean {
    const base = path.basename(fileAbs);
    return exts.some(ext => base === `index${ext}`);
}
