import fs from "node:fs";
import ts from "typescript";
import { resolveModuleFromSpecifier } from "../../core/import-utils.js";
import { getPathStamp, normalize } from "../../core/path-utils.js";
import type { AliasMapping } from "../../core/types.js";
import type { ExportBinding, ModuleExportMap } from "./types.js";

type ExportMapCacheEntry = {
    dependencyStamps: Map<string, string | null>;
    exportMap: ModuleExportMap | null;
};

const exportMapCache = new Map<string, ExportMapCacheEntry>();

function haveStampsChanged(stamps: Map<string, string | null>) {
    for (const [targetAbs, stamp] of stamps.entries()) {
        if (getPathStamp(targetAbs) !== stamp) return true;
    }

    return false;
}

function createStampMap(targets: Iterable<string>) {
    return new Map(
        [...targets].map(target => [normalize(target), getPathStamp(target)]),
    );
}

function getTsSourceFile(absFile: string): ts.SourceFile | null {
    try {
        const text = fs.readFileSync(absFile, "utf8");
        return ts.createSourceFile(
            absFile,
            text,
            ts.ScriptTarget.Latest,
            true,
            absFile.endsWith(".tsx") || absFile.endsWith(".jsx")
                ? ts.ScriptKind.TSX
                : ts.ScriptKind.TS,
        );
    } catch {
        return null;
    }
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
    if (!ts.canHaveModifiers(node)) return false;

    const modifiers = ts.getModifiers(node);
    return !!modifiers?.some(modifier => modifier.kind === kind);
}

function hasExportModifier(node: ts.Node): boolean {
    return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function hasDefaultModifier(node: ts.Node): boolean {
    return hasModifier(node, ts.SyntaxKind.DefaultKeyword);
}

function collectBindingNames(name: ts.BindingName, out: string[]) {
    if (ts.isIdentifier(name)) {
        out.push(name.text);
        return;
    }

    for (const element of name.elements) {
        if (ts.isBindingElement(element)) {
            collectBindingNames(element.name, out);
        }
    }
}

function collectDeclaredNames(statement: ts.Statement): string[] {
    const names: string[] = [];

    if (
        ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement) ||
        ts.isModuleDeclaration(statement)
    ) {
        if (statement.name) names.push(statement.name.text);
        return names;
    }

    if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
            collectBindingNames(declaration.name, names);
        }
    }

    return names;
}

function createBinding(
    targetFileAbs: string,
    targetExportName: string,
    kind: ExportBinding["kind"],
): ExportBinding {
    return {
        targetFileAbs,
        targetExportName,
        kind,
    };
}

function getOptionsCacheKey(params: {
    aliasMappings: AliasMapping[];
    exts: string[];
}) {
    return JSON.stringify({
        exts: params.exts,
        aliasMappings: params.aliasMappings.map(mapping => ({
            alias: mapping.alias,
            targetRootAbs: normalize(mapping.targetRootAbs),
            order: mapping.order,
        })),
    });
}

export function getModuleExportMap(params: {
    fileAbs: string;
    options: {
        aliasMappings: AliasMapping[];
        exts: string[];
    };
    stack?: Set<string>;
    collector?: Set<string>;
}): ModuleExportMap | null {
    const key = normalize(params.fileAbs);
    const stack = params.stack ?? new Set<string>();
    if (stack.has(key)) return null;
    stack.add(key);

    const localDependencies = new Set<string>([key]);

    const cacheKey = `${key}::${getOptionsCacheKey(params.options)}`;
    const cached = exportMapCache.get(cacheKey);
    if (cached && !haveStampsChanged(cached.dependencyStamps)) {
        for (const dependencyAbs of cached.dependencyStamps.keys()) {
            localDependencies.add(dependencyAbs);
        }
        if (params.collector) {
            for (const dependencyAbs of localDependencies) {
                params.collector.add(dependencyAbs);
            }
        }
        stack.delete(key);
        return cached.exportMap;
    }

    const sourceFile = getTsSourceFile(params.fileAbs);
    if (!sourceFile) {
        exportMapCache.set(cacheKey, {
            dependencyStamps: createStampMap(localDependencies),
            exportMap: null,
        });
        if (params.collector) {
            for (const dependencyAbs of localDependencies) {
                params.collector.add(dependencyAbs);
            }
        }
        stack.delete(key);
        return null;
    }

    const localBindings = new Map<string, ExportBinding>();
    const exportMap: ModuleExportMap = new Map();

    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement) && statement.moduleSpecifier) {
            if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;

            const targetFileAbs = resolveModuleFromSpecifier({
                fromFileAbs: params.fileAbs,
                specifier: statement.moduleSpecifier.text,
                aliasMappings: params.options.aliasMappings,
                exts: params.options.exts,
            });
            if (!targetFileAbs) continue;
            localDependencies.add(normalize(targetFileAbs));

            const clause = statement.importClause;
            if (!clause) continue;

            if (clause.name) {
                localBindings.set(
                    clause.name.text,
                    createBinding(targetFileAbs, "default", "default"),
                );
            }

            if (!clause.namedBindings) continue;

            if (ts.isNamespaceImport(clause.namedBindings)) {
                localBindings.set(
                    clause.namedBindings.name.text,
                    createBinding(targetFileAbs, "*", "namespace"),
                );
                continue;
            }

            if (ts.isNamedImports(clause.namedBindings)) {
                for (const element of clause.namedBindings.elements) {
                    const importedName = element.propertyName
                        ? element.propertyName.text
                        : element.name.text;
                    localBindings.set(
                        element.name.text,
                        createBinding(targetFileAbs, importedName, "named"),
                    );
                }
            }

            continue;
        }

        for (const name of collectDeclaredNames(statement)) {
            localBindings.set(
                name,
                createBinding(params.fileAbs, name, "named"),
            );
        }

        if (
            (ts.isFunctionDeclaration(statement) ||
                ts.isClassDeclaration(statement)) &&
            statement.name &&
            hasExportModifier(statement)
        ) {
            if (hasDefaultModifier(statement)) {
                exportMap.set(
                    "default",
                    createBinding(params.fileAbs, "default", "default"),
                );
            } else {
                exportMap.set(
                    statement.name.text,
                    createBinding(params.fileAbs, statement.name.text, "named"),
                );
            }
            continue;
        }

        if (
            (ts.isInterfaceDeclaration(statement) ||
                ts.isTypeAliasDeclaration(statement) ||
                ts.isEnumDeclaration(statement) ||
                ts.isModuleDeclaration(statement)) &&
            statement.name &&
            hasExportModifier(statement)
        ) {
            exportMap.set(
                statement.name.text,
                createBinding(params.fileAbs, statement.name.text, "named"),
            );
            continue;
        }

        if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                const names: string[] = [];
                collectBindingNames(declaration.name, names);
                for (const name of names) {
                    exportMap.set(
                        name,
                        createBinding(params.fileAbs, name, "named"),
                    );
                }
            }
            continue;
        }

        if (ts.isExportAssignment(statement)) {
            exportMap.set(
                "default",
                createBinding(params.fileAbs, "default", "default"),
            );
            continue;
        }

        if (!ts.isExportDeclaration(statement)) continue;

        const moduleSpecifier =
            statement.moduleSpecifier &&
            ts.isStringLiteral(statement.moduleSpecifier)
                ? statement.moduleSpecifier.text
                : null;

        if (moduleSpecifier) {
            const targetModuleAbs = resolveModuleFromSpecifier({
                fromFileAbs: params.fileAbs,
                specifier: moduleSpecifier,
                aliasMappings: params.options.aliasMappings,
                exts: params.options.exts,
            });
            if (!targetModuleAbs) continue;
            localDependencies.add(normalize(targetModuleAbs));

            if (statement.exportClause) {
                if (ts.isNamespaceExport(statement.exportClause)) {
                    exportMap.set(
                        statement.exportClause.name.text,
                        createBinding(targetModuleAbs, "*", "namespace"),
                    );
                    continue;
                }

                if (ts.isNamedExports(statement.exportClause)) {
                    for (const element of statement.exportClause.elements) {
                        const exportedName = element.name.text;
                        const sourceName = element.propertyName
                            ? element.propertyName.text
                            : element.name.text;

                        if (sourceName === "default") {
                            exportMap.set(
                                exportedName,
                                createBinding(
                                    targetModuleAbs,
                                    "default",
                                    "default",
                                ),
                            );
                            continue;
                        }

                        const nested = getModuleExportMap({
                            fileAbs: targetModuleAbs,
                            options: params.options,
                            stack,
                            collector: localDependencies,
                        });
                        const resolved = nested?.get(sourceName);

                        exportMap.set(
                            exportedName,
                            resolved ??
                                createBinding(
                                    targetModuleAbs,
                                    sourceName,
                                    "named",
                                ),
                        );
                    }
                    continue;
                }
            }

            const nested = getModuleExportMap({
                fileAbs: targetModuleAbs,
                options: params.options,
                stack,
                collector: localDependencies,
            });
            if (!nested) continue;

            for (const [name, binding] of nested.entries()) {
                if (name === "default") continue;
                if (!exportMap.has(name)) exportMap.set(name, binding);
            }

            continue;
        }

        if (
            statement.exportClause &&
            ts.isNamedExports(statement.exportClause)
        ) {
            for (const element of statement.exportClause.elements) {
                const exportedName = element.name.text;
                const localName = element.propertyName
                    ? element.propertyName.text
                    : element.name.text;

                exportMap.set(
                    exportedName,
                    localBindings.get(localName) ??
                        createBinding(params.fileAbs, localName, "named"),
                );
            }
        }
    }

    exportMapCache.set(cacheKey, {
        dependencyStamps: createStampMap(localDependencies),
        exportMap,
    });
    if (params.collector) {
        for (const dependencyAbs of localDependencies) {
            params.collector.add(dependencyAbs);
        }
    }
    stack.delete(key);
    return exportMap;
}
