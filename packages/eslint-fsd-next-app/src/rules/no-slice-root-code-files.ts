import path from "node:path";
import type { Rule } from "eslint";
import { resolveRuleConfig } from "../core/config.js";
import {
    isCodeFile,
    isWithinDir,
    normalize,
    toRealPathIfExists,
} from "../core/path-utils.js";
import { getSharedSettings } from "../core/shared-settings.js";

function requiresBoundaryPublicApi(
    boundary: {
        layer: string;
        kind: "slice" | "segment";
    },
    publicApiRequiredSegmentLayers: Set<string>,
) {
    return (
        boundary.kind === "slice" ||
        publicApiRequiredSegmentLayers.has(boundary.layer)
    );
}

function getBoundaryLabel(boundary: { kind: "slice" | "segment" }) {
    return boundary.kind === "segment" ? "Segment" : "Slice";
}

const rule: Rule.RuleModule = {
    meta: {
        type: "problem",
        schema: [
            {
                type: "object",
                additionalProperties: false,
                properties: {},
            },
        ],
    },

    create(context) {
        const importerAbs = toRealPathIfExists(
            context.getFilename?.() ?? context.filename,
        );
        if (!path.isAbsolute(importerAbs)) return {};

        const settings = getSharedSettings(context);
        const projectRootAbs = toRealPathIfExists(
            "cwd" in context && typeof context.cwd === "string"
                ? context.cwd
                : process.cwd(),
        );
        const resolved = resolveRuleConfig({
            settings,
            projectRootAbs,
            importerAbs,
        });

        if (!resolved.config) {
            return {
                Program(node) {
                    context.report({
                        node,
                        message:
                            "fsd/no-slice-root-code-files invalid option: " +
                            resolved.error,
                    });
                },
            } satisfies Rule.RuleListener;
        }

        const config = resolved.config;
        const publicApiFiles = new Set(config.publicApiFiles);
        const publicApiRequiredSegmentLayers = new Set(
            config.publicApiRequiredSegmentLayers,
        );
        const sliceLayers = new Set(config.sliceLayers);
        const segmentLayers = new Set(config.segmentLayers);

        return {
            Program(node) {
                if (!isCodeFile(importerAbs, config.exts)) return;
                if (!isWithinDir(importerAbs, config.fsdRootAbs)) return;

                const rel = normalize(
                    path.relative(config.fsdRootAbs, importerAbs),
                );
                if (rel.startsWith("..") || path.isAbsolute(rel)) return;

                const parts = rel.split("/").filter(Boolean);
                if (parts.length !== 3) return;

                const [layer, unit, fileName] = parts;
                if (!(layer && unit && fileName)) return;

                const boundary = sliceLayers.has(layer)
                    ? { layer, kind: "slice" as const }
                    : segmentLayers.has(layer)
                      ? { layer, kind: "segment" as const }
                      : null;
                if (
                    !(
                        boundary &&
                        requiresBoundaryPublicApi(
                            boundary,
                            publicApiRequiredSegmentLayers,
                        )
                    )
                ) {
                    return;
                }
                if (publicApiFiles.has(fileName)) return;

                context.report({
                    node,
                    message:
                        `${getBoundaryLabel(boundary)} root "${layer}/${unit}" must only expose public API files ` +
                        `(${[...publicApiFiles].join(", ")}). Move "${fileName}" into a segment directory.`,
                });
            },
        } satisfies Rule.RuleListener;
    },
};

export default rule;
