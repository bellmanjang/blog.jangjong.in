"use client";

import { ScrollArea } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { syntaxHighlighterLanguage } from "../../../lib/react-syntax-highlighter-lang";
import { lightDarkTheme } from "../../../lib/react-syntax-highlighter-theme";

interface Props {
    code: string;
    lang: string;
}

export const HighlightedPre = ({ code, lang }: Props) => {
    const lines = code.split("\n").length;
    const digits = String(lines).length;
    const lineNumbers = Array.from({ length: lines }, (_, index) => index + 1);

    const Pre = ({
        children,
        className,
        style,
        ...props
    }: PropsWithChildren<ComponentPropsWithoutRef<"pre">>) => {
        return (
            <div
                className="md-pre-wrapper"
                style={
                    {
                        "--ln-width": `${digits}ch`,
                    } as React.CSSProperties
                }
            >
                <div aria-hidden className="md-pre-line-numbers">
                    {lineNumbers.map(lineNumber => (
                        <span key={lineNumber} className="md-pre-line-number">
                            {lineNumber}
                        </span>
                    ))}
                </div>

                <ScrollArea
                    className="md-pre-scroll-area"
                    scrollbars="horizontal"
                >
                    <pre {...props} className={className} style={style}>
                        {children}
                    </pre>
                </ScrollArea>
            </div>
        );
    };

    return (
        <ScrollArea scrollbars="vertical">
            <SyntaxHighlighter
                PreTag={Pre}
                language={syntaxHighlighterLanguage(lang)}
                style={lightDarkTheme}
                customStyle={{
                    background: "transparent",
                }}
            >
                {code}
            </SyntaxHighlighter>
        </ScrollArea>
    );
};
