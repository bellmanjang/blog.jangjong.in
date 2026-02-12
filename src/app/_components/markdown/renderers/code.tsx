"use client";

import { Button, Code, Skeleton, Text } from "@radix-ui/themes";
import { Check, TriangleAlert } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import type { Components } from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
    solarizedDark,
    solarizedLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { MermaidBlock } from "@/app/_components/markdown/blocks/MermaidBlock";
import { ExpandableBox } from "@/app/_components/ui/expandable-box";
import { copyClipboard } from "@/lib/utils/clipboard-util";

const LANG_RE = /language-(\w+)/;

export const codeRenderer: Components["code"] = props => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "failed">(
        "idle",
    );
    const timer = useRef<number | undefined>(undefined);

    const { children, className } = props;

    const codeString = String(children ?? "").replace(/\n$/, "");
    const match = LANG_RE.exec(className ?? "");

    if (match) {
        if (!mounted) return <Skeleton width="100%" height="160px" />;

        const lang = match[1];

        if (lang === "mermaid") {
            return <MermaidBlock code={codeString} />;
        }

        return (
            <div className="md-code-block">
                <Button
                    className="md-code-copy-btn"
                    size="1"
                    color="gray"
                    highContrast
                    variant="outline"
                    onClick={() => {
                        if (copyStatus !== "idle") return;

                        copyClipboard(codeString)
                            .then(() => setCopyStatus("success"))
                            .catch(() => setCopyStatus("failed"))
                            .finally(() => {
                                window.clearTimeout(timer.current);
                                timer.current = window.setTimeout(() => {
                                    setCopyStatus("idle");
                                }, 2000);
                            });
                    }}
                >
                    <Text weight="bold">
                        {copyStatus === "idle" && "Copy"}
                        {copyStatus === "success" && (
                            <>
                                <Check
                                    className={"inline-block align-middle"}
                                    size={16}
                                    strokeWidth={2.5}
                                />{" "}
                                Copied
                            </>
                        )}
                        {copyStatus === "failed" && (
                            <>
                                <TriangleAlert
                                    className={"inline-block align-middle"}
                                    size={16}
                                    strokeWidth={2.5}
                                />{" "}
                                Copy failed
                            </>
                        )}
                    </Text>
                </Button>
                <ExpandableBox>
                    <SyntaxHighlighter
                        PreTag="div"
                        language={lang}
                        // showLineNumbers
                        style={
                            resolvedTheme === "dark"
                                ? solarizedDark
                                : solarizedLight
                        }
                        customStyle={{
                            background: "tansparent",
                        }}
                    >
                        {codeString}
                    </SyntaxHighlighter>
                </ExpandableBox>
            </div>
        );
    }

    return (
        <Code className="md-inline-code" variant="soft" highContrast>
            {children}
        </Code>
    );
};
