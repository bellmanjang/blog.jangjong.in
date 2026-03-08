export type SharedSettings = {
    "fsd-root"?: string;
    "fsd-tsconfig-path"?: string;
    "fsd-alias-preference"?: "root" | "most-specific";
    "fsd-exts"?: string[];
    "fsd-public-api-files"?: string[];
    "fsd-public-api-required-segment-layers"?: string[];
    "fsd-slice-layers"?: string[];
    "fsd-segment-layers"?: string[];
};

export type AliasMapping = {
    alias: string;
    targetRootAbs: string;
    order: number;
};

export type ResolvedRuleConfig = {
    fsdRoot: string;
    fsdRootAbs: string;
    rootAlias: string | null;
    aliasMappings: AliasMapping[];
    aliasPreference: "root" | "most-specific";
    exts: string[];
    publicApiFiles: string[];
    publicApiRequiredSegmentLayers: string[];
    sliceLayers: string[];
    segmentLayers: string[];
};
