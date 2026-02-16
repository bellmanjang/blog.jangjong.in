"use client";

import { Box, Button, ScrollArea, Skeleton, Text } from "@radix-ui/themes";
import { Check, TriangleAlert } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import {
    atomOneDark,
    atomOneLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ExpandableBox } from "@/app/_components/ui/expandable-box";
import { cx } from "@/lib/utils/class-util";
import { copyClipboard } from "@/lib/utils/clipboard-util";
import { parseLang } from "@/lib/utils/react-syntax-highlighter-util";

export const FencedCodeClient = ({
    className,
    code,
    lang,
    expandable = true,
}: {
    className?: string;
    code: string;
    lang: string;
    expandable?: boolean;
}) => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "failed">(
        "idle",
    );
    const timer = useRef<number | undefined>(undefined);

    const Pre = useMemo(
        () => () => {
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
                        language={parseLang(lang)}
                        showLineNumbers
                        style={
                            resolvedTheme === "dark"
                                ? atomOneDark
                                : atomOneLight
                        }
                        customStyle={{
                            background: "tansparent",
                        }}
                    >
                        {code}
                    </SyntaxHighlighter>
                </div>
            );
        },
        [code, lang, resolvedTheme, mounted],
    );

    if (!mounted)
        return (
            <Skeleton
                className={cx("md-fenced-code", className)}
                style={{
                    width: "100%",
                    height: "170px",
                }}
            />
        );

    return (
        <div className={cx("md-fenced-code", className)}>
            <Box className="md-code-copy-btn-wrapper">
                <Button
                    size="1"
                    color="gray"
                    highContrast
                    variant="surface"
                    onClick={() => {
                        if (copyStatus !== "idle") return;

                        copyClipboard(code)
                            .then(() => setCopyStatus("success"))
                            .catch(() => setCopyStatus("failed"))
                            .finally(() => {
                                window.clearTimeout(timer.current);
                                timer.current = window.setTimeout(
                                    () => setCopyStatus("idle"),
                                    2000,
                                );
                            });
                    }}
                >
                    <Text weight="bold">
                        {copyStatus === "idle" && "Copy"}
                        {copyStatus === "success" && (
                            <>
                                <Check
                                    className="inline-block align-middle"
                                    size={16}
                                    strokeWidth={2.5}
                                />{" "}
                                Copied
                            </>
                        )}
                        {copyStatus === "failed" && (
                            <>
                                <TriangleAlert
                                    className="inline-block align-middle"
                                    size={16}
                                    strokeWidth={2.5}
                                />{" "}
                                Copy failed
                            </>
                        )}
                    </Text>
                </Button>
            </Box>

            {expandable ? (
                <ExpandableBox>
                    <Pre />
                </ExpandableBox>
            ) : (
                <ScrollArea scrollbars="both">
                    <Pre />
                </ScrollArea>
            )}
        </div>
    );
};
