"use client";

import { useTheme } from "next-themes";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
    atomOneDark,
    atomOneLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { syntaxHighlighterLanguage } from "@/lib/utils/react-syntax-highlighter-util";

interface Props {
    code: string;
    lang: string;
}

export const HighlightedPre = ({ code, lang }: Props) => {
    const { resolvedTheme } = useTheme();

    const lines = code.split("\n").length;
    const digits = String(lines).length;

    return (
        <div
            className="md-pre-wrapper"
            style={
                {
                    "--ln-width": `${digits}ch`,
                } as React.CSSProperties
            }
        >
            <SyntaxHighlighter
                PreTag="pre"
                language={syntaxHighlighterLanguage(lang)}
                showLineNumbers
                style={resolvedTheme === "dark" ? atomOneDark : atomOneLight}
                customStyle={{
                    background: "transparent",
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};
