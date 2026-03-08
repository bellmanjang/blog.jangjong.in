import type { Rule } from "eslint";

export type BoundaryKind = "slice" | "segment";

export type BoundaryInfo = {
    layer: string;
    unit: string;
    kind: BoundaryKind;
};

export type BindingKind = "named" | "default" | "namespace";

export type ExportBinding = {
    targetFileAbs: string;
    targetExportName: string;
    kind: BindingKind;
};

export type ModuleExportMap = Map<string, ExportBinding>;

export type ReportFixer = Rule.ReportFixer;
