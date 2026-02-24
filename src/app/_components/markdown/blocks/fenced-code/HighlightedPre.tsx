"use client";

import SyntaxHighlighter from "react-syntax-highlighter";
import {
    lightDarkTheme,
    syntaxHighlighterLanguage,
} from "@/lib/utils/react-syntax-highlighter-util";

interface Props {
    code: string;
    lang: string;
}

export const HighlightedPre = ({ code, lang }: Props) => {
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
                style={lightDarkTheme}
                customStyle={{
                    background: "transparent",
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};
