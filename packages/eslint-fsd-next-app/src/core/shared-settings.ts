import type { Rule } from "eslint";
import type { SharedSettings } from "./types.js";

export function getSharedSettings(context: Rule.RuleContext): SharedSettings {
    const settings = context.settings as Record<string, unknown> | undefined;

    return {
        "fsd-root":
            typeof settings?.["fsd-root"] === "string"
                ? (settings["fsd-root"] as string)
                : undefined,
        "fsd-tsconfig-path":
            typeof settings?.["fsd-tsconfig-path"] === "string"
                ? (settings["fsd-tsconfig-path"] as string)
                : undefined,
        "fsd-alias-preference":
            settings?.["fsd-alias-preference"] === "root" ||
            settings?.["fsd-alias-preference"] === "most-specific"
                ? (settings["fsd-alias-preference"] as "root" | "most-specific")
                : undefined,
        "fsd-exts": Array.isArray(settings?.["fsd-exts"])
            ? ((settings["fsd-exts"] as unknown[]).filter(
                  value => typeof value === "string",
              ) as string[])
            : undefined,
        "fsd-public-api-files": Array.isArray(
            settings?.["fsd-public-api-files"],
        )
            ? ((settings["fsd-public-api-files"] as unknown[]).filter(
                  value => typeof value === "string",
              ) as string[])
            : undefined,
        "fsd-public-api-required-segment-layers": Array.isArray(
            settings?.["fsd-public-api-required-segment-layers"],
        )
            ? ((
                  settings[
                      "fsd-public-api-required-segment-layers"
                  ] as unknown[]
              ).filter(value => typeof value === "string") as string[])
            : undefined,
        "fsd-slice-layers": Array.isArray(settings?.["fsd-slice-layers"])
            ? ((settings["fsd-slice-layers"] as unknown[]).filter(
                  value => typeof value === "string",
              ) as string[])
            : undefined,
        "fsd-segment-layers": Array.isArray(settings?.["fsd-segment-layers"])
            ? ((settings["fsd-segment-layers"] as unknown[]).filter(
                  value => typeof value === "string",
              ) as string[])
            : undefined,
    };
}
