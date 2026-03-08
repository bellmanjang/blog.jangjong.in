import type { Rule } from "eslint";
import type { ImportDeclaration, Literal } from "estree";
import { getQuoteFromLiteral } from "../../core/import-utils.js";
import { normalize } from "../../core/path-utils.js";
import type { AliasMapping } from "../../core/types.js";
import { getModuleExportMap } from "./export-map.js";
import { toRelativeImport } from "./path-utils.js";
import type { BindingKind, ReportFixer } from "./types.js";

type NamedSpecifier = {
    imported: string;
    local: string;
    isType: boolean;
};

type ImportGroup = {
    defaultLocal?: string;
    namespaceLocal?: string;
    named: NamedSpecifier[];
};

function buildImportText(params: {
    source: string;
    quote: "'" | '"';
    hasSemicolon: boolean;
    defaultLocal?: string;
    namespaceLocal?: string;
    named: NamedSpecifier[];
}): string | null {
    const pieces: string[] = [];

    if (params.defaultLocal) {
        pieces.push(params.defaultLocal);
    }

    if (params.namespaceLocal) {
        pieces.push(`* as ${params.namespaceLocal}`);
    }

    if (params.named.length > 0) {
        const allType = params.named.every(entry => entry.isType);
        const members = params.named.map(entry => {
            const base =
                entry.imported === entry.local
                    ? entry.imported
                    : `${entry.imported} as ${entry.local}`;
            return entry.isType && !allType ? `type ${base}` : base;
        });

        if (allType && !params.defaultLocal && !params.namespaceLocal) {
            pieces.push(`type { ${members.join(", ")} }`);
        } else {
            pieces.push(`{ ${members.join(", ")} }`);
        }
    }

    if (pieces.length === 0) return null;

    return `import ${pieces.join(", ")} from ${params.quote}${params.source}${params.quote}${params.hasSemicolon ? ";" : ""}`;
}

export function buildSameSlicePublicApiFix(params: {
    node: ImportDeclaration;
    importerAbs: string;
    barrelFileAbs: string;
    sourceLit: Literal;
    context: Rule.RuleContext;
    options: {
        aliasMappings: AliasMapping[];
        exts: string[];
    };
}): ReportFixer | null {
    const normalizedBarrelFileAbs = normalize(params.barrelFileAbs);

    const exportMap = getModuleExportMap({
        fileAbs: params.barrelFileAbs,
        options: params.options,
    });
    if (!exportMap) return null;
    if (params.node.specifiers.length === 0) return null;

    const entries: Array<{
        targetFileAbs: string;
        kind: BindingKind;
        imported: string;
        local: string;
        isType: boolean;
    }> = [];

    for (const specifier of params.node.specifiers as Array<
        ImportDeclaration["specifiers"][number] & {
            importKind?: "type" | "value";
        }
    >) {
        const nodeImportKind = ((
            params.node as { importKind?: "type" | "value" }
        ).importKind ?? "value") as "type" | "value";
        const specImportKind = specifier.importKind ?? "value";
        const isType = nodeImportKind === "type" || specImportKind === "type";

        if (specifier.type === "ImportSpecifier") {
            const imported =
                specifier.imported.type === "Identifier"
                    ? specifier.imported.name
                    : typeof specifier.imported.value === "string"
                      ? specifier.imported.value
                      : null;
            if (!imported) return null;
            const binding = exportMap.get(imported);
            if (!binding) return null;
            if (normalize(binding.targetFileAbs) === normalizedBarrelFileAbs) {
                return null;
            }

            entries.push({
                targetFileAbs: binding.targetFileAbs,
                kind: binding.kind,
                imported: binding.targetExportName,
                local: specifier.local.name,
                isType,
            });
            continue;
        }

        if (specifier.type === "ImportDefaultSpecifier") {
            const binding = exportMap.get("default");
            if (!binding) return null;
            if (normalize(binding.targetFileAbs) === normalizedBarrelFileAbs) {
                return null;
            }

            entries.push({
                targetFileAbs: binding.targetFileAbs,
                kind: binding.kind,
                imported: binding.targetExportName,
                local: specifier.local.name,
                isType,
            });
            continue;
        }

        if (specifier.type === "ImportNamespaceSpecifier") {
            return null;
        }

        return null;
    }

    const quote = getQuoteFromLiteral(params.sourceLit);
    const hasSemicolon = params.context.sourceCode
        .getText(params.node)
        .trimEnd()
        .endsWith(";");

    const groups = new Map<string, ImportGroup>();

    for (const entry of entries) {
        const key = normalize(entry.targetFileAbs);
        const group = groups.get(key) ?? { named: [] };

        if (entry.kind === "default") {
            if (group.defaultLocal && group.defaultLocal !== entry.local) {
                return null;
            }
            group.defaultLocal = entry.local;
        } else if (entry.kind === "namespace") {
            if (group.namespaceLocal && group.namespaceLocal !== entry.local) {
                return null;
            }
            group.namespaceLocal = entry.local;
        } else {
            group.named.push({
                imported: entry.imported,
                local: entry.local,
                isType: entry.isType,
            });
        }

        groups.set(key, group);
    }

    const nextImports: string[] = [];
    if (groups.size > 1) return null;

    for (const [targetFileAbs, group] of groups.entries()) {
        const nextSource = toRelativeImport({
            importerAbs: params.importerAbs,
            targetFileAbs,
            exts: params.options.exts,
        });

        const importText = buildImportText({
            source: nextSource,
            quote,
            hasSemicolon,
            defaultLocal: group.defaultLocal,
            namespaceLocal: group.namespaceLocal,
            named: group.named,
        });
        if (!importText) return null;

        nextImports.push(importText);
    }

    if (nextImports.length === 0) return null;
    return fixer =>
        fixer.replaceText(params.node as never, nextImports.join("\n"));
}
