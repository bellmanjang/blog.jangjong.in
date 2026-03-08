import fsd from "@bellmanjang/eslint-fsd-next-app";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
    // 1) Next.js 기본 규칙 (공식 권장: core-web-vitals)
    ...nextVitals,

    // 2) eslint-config-next 기본 ignore를 필요에 맞게 오버라이드
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "dist/**",
        "coverage/**",
        "next-env.d.ts",
        "packages/**",
    ]),

    {
        plugins: { boundaries },
        settings: {
            "boundaries/include": ["src/**/*.{ts,tsx,js,jsx}"],
            "boundaries/elements": [
                {
                    type: "app",
                    pattern: "src/app/*.{js,jsx,ts,tsx}",
                    mode: "file",
                },
                {
                    type: "app",
                    pattern: "src/app/!(_*){,/*}",
                    mode: "folder",
                    capture: ["slice"],
                },
                {
                    type: "features",
                    pattern: "src/features/!(_*){,/*}",
                    mode: "folder",
                    capture: ["slice"],
                },
                {
                    type: "widgets",
                    pattern: "src/widgets/!(_*){,/*}",
                    mode: "folder",
                    capture: ["slice"],
                },
                {
                    type: "entities",
                    pattern: "src/entities/!(_*){,/*}",
                    mode: "folder",
                    capture: ["slice"],
                },
                {
                    type: "shared",
                    pattern: "src/shared/!(_*){,/*}",
                    mode: "folder",
                    capture: ["slice"],
                },
            ],
            "import/resolver": {
                typescript: { project: ["./tsconfig.json"] },
                node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
            },
        },
        rules: {
            "boundaries/element-types": [
                "error",
                {
                    default: "disallow",
                    rules: [
                        {
                            from: "app",
                            allow: [
                                "app",
                                "widgets",
                                "features",
                                "entities",
                                "shared",
                            ],
                        },
                        {
                            from: "widgets",
                            allow: ["features", "entities", "shared"],
                        },
                        {
                            from: "features",
                            allow: ["entities", "shared"],
                        },
                        {
                            from: "entities",
                            allow: ["shared"],
                        },
                        {
                            from: "shared",
                            allow: ["shared"],
                        },
                    ],
                },
            ],
        },
    },

    {
        plugins: {
            fsd,
        },
        settings: {
            "fsd-root": "src",
            "fsd-slice-layers": ["widgets", "features", "entities"],
            "fsd-segment-layers": ["app", "shared"],
            "fsd-alias-preference": "most-specific",
        },
        rules: {
            "fsd/exports-imports": "error",
            "fsd/no-slice-root-code-files": "error",
            "fsd/prefer-alias-imports": "error",
        },
    },
]);

export default eslintConfig;
