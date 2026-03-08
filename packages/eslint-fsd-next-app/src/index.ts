import exportsImports from "./rules/exports-imports.js";
import noSliceRootCodeFiles from "./rules/no-slice-root-code-files.js";
import preferAliasImports from "./rules/prefer-alias-imports.js";

const plugin = {
    rules: {
        "exports-imports": exportsImports,
        "no-slice-root-code-files": noSliceRootCodeFiles,
        "prefer-alias-imports": preferAliasImports,
    },
};

export default plugin;
