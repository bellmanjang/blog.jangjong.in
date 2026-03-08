import fs from "node:fs";
import path from "node:path";
import type { Rule } from "eslint";
import type {
    ExportAllDeclaration,
    ExportNamedDeclaration,
    ImportDeclaration,
    ImportExpression,
    Literal,
} from "estree";
import { matchAliasSpecifier } from "./alias-utils.js";
import { getPathStamp, normalize, toRealPathIfExists } from "./path-utils.js";
import type { AliasMapping } from "./types.js";

export type ImportLikeNode =
    | ImportDeclaration
    | ExportNamedDeclaration
    | ExportAllDeclaration
    | ImportExpression;

type ResolveBaseCacheEntry = {
    baseStamp: string | null;
    parentStamp: string | null;
    result: string | null;
};

const resolveBaseCache = new Map<string, ResolveBaseCacheEntry>();

function getExtsCacheKey(exts: string[]) {
    return exts.join("|");
}

export function getSourceLiteral(node: ImportLikeNode): Literal | null {
    const sourceNode = node.source;
    if (!sourceNode) return null;

    const value = (sourceNode as { value?: unknown }).value;
    if (typeof value !== "string") return null;

    return sourceNode as Literal;
}

export function getQuoteFromLiteral(lit: Literal): "'" | '"' {
    const raw = (lit as { raw?: string }).raw;
    return raw?.[0] === "'" ? "'" : '"';
}

export function replaceSourceLiteral(
    lit: Literal,
    nextSource: string,
    fixer: Rule.RuleFixer,
): Rule.Fix {
    const quote = getQuoteFromLiteral(lit);
    return fixer.replaceText(lit as never, `${quote}${nextSource}${quote}`);
}

export function isRelativeImport(source: string): boolean {
    return source.startsWith(".");
}

export function resolveBaseToExistingFile(
    baseAbs: string,
    exts: string[],
): string | null {
    const cacheKey = `${normalize(baseAbs)}::${getExtsCacheKey(exts)}`;
    const baseStamp = getPathStamp(baseAbs);
    const parentStamp = getPathStamp(path.dirname(baseAbs));
    const cached = resolveBaseCache.get(cacheKey);
    if (
        cached &&
        cached.baseStamp === baseStamp &&
        cached.parentStamp === parentStamp
    ) {
        return cached.result;
    }

    let result: string | null = null;
    try {
        if (fs.existsSync(baseAbs) && fs.statSync(baseAbs).isFile()) {
            result = toRealPathIfExists(baseAbs);
        } else {
            for (const ext of exts) {
                const fileAbs = baseAbs + ext;
                if (fs.existsSync(fileAbs) && fs.statSync(fileAbs).isFile()) {
                    result = toRealPathIfExists(fileAbs);
                    break;
                }
            }
        }

        if (
            !result &&
            fs.existsSync(baseAbs) &&
            fs.statSync(baseAbs).isDirectory()
        ) {
            for (const ext of exts) {
                const indexFileAbs = path.join(baseAbs, `index${ext}`);
                if (
                    fs.existsSync(indexFileAbs) &&
                    fs.statSync(indexFileAbs).isFile()
                ) {
                    result = toRealPathIfExists(indexFileAbs);
                    break;
                }
            }
        }
    } catch {
        result = null;
    }

    resolveBaseCache.set(cacheKey, {
        baseStamp,
        parentStamp,
        result,
    });
    return result;
}

export function resolveToExistingFile(params: {
    source: string;
    importerAbs: string;
    aliasMappings: AliasMapping[];
    exts: string[];
}): string | null {
    let baseAbs: string | null = null;

    if (isRelativeImport(params.source)) {
        baseAbs = path.resolve(path.dirname(params.importerAbs), params.source);
    } else {
        const aliasMatch = matchAliasSpecifier(
            params.source,
            params.aliasMappings,
        );
        if (!aliasMatch) return null;
        baseAbs = aliasMatch.baseAbs;
    }

    return resolveBaseToExistingFile(baseAbs, params.exts);
}

export function resolveModuleFromSpecifier(params: {
    fromFileAbs: string;
    specifier: string;
    aliasMappings: AliasMapping[];
    exts: string[];
}): string | null {
    return resolveToExistingFile({
        source: params.specifier,
        importerAbs: params.fromFileAbs,
        aliasMappings: params.aliasMappings,
        exts: params.exts,
    });
}
