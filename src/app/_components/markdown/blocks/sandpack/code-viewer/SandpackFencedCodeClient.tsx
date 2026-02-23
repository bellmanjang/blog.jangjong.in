"use client";

import { ScrollArea } from "@radix-ui/themes";
import dynamic from "next/dynamic";
import { TextCopyButton } from "@/app/_components/markdown/blocks/fenced-code/TextCopyButton";

const HighlightedPre = dynamic(
    () =>
        import("../../fenced-code/HighlightedPre").then(m => m.HighlightedPre),
    {
        ssr: false,
    },
);

export const SandpackFencedCodeClient = ({
    code,
    lang,
}: {
    code: string;
    lang: string;
}) => {
    return (
        <div className="md-fenced-code md-sp-fenced-code">
            <TextCopyButton text={code} />
            <ScrollArea scrollbars="both">
                <HighlightedPre code={code} lang={lang} />
            </ScrollArea>
        </div>
    );
};
