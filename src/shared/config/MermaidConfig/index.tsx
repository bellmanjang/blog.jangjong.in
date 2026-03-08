"use client";

import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export const MermaidConfig = () => {
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (!resolvedTheme) return;

        mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            themeVariables: {
                darkMode: resolvedTheme === "dark",
                fontFamily: "var(--font-mono)",
                background: resolvedTheme === "dark" ? "#171918" : "#F7F9F8",
                primaryColor: resolvedTheme === "dark" ? "#853A2D" : "#FEEBE7",
                primaryTextColor:
                    resolvedTheme === "dark" ? "#ECEEED" : "#1A211E",
                noteBkgColor: "#FFF7C2",
                noteTextColor: "#1A211E",
                pieTitleTextColor:
                    resolvedTheme === "dark" ? "#ECEEED" : "#1A211E",
                pieLegendTextColor:
                    resolvedTheme === "dark" ? "#ECEEED" : "#1A211E",
                pieStrokeColor:
                    resolvedTheme === "dark" ? "#ECEEED" : "#1A211E",
                pieOuterStrokeColor:
                    resolvedTheme === "dark" ? "#ECEEED" : "#1A211E",
            },
        });
    }, [resolvedTheme]);

    return null;
};
