"use client";

import { ScrollArea } from "@radix-ui/themes";
import { HighlightedPre } from "../../fenced-code/HighlightedPre";
import { TextCopyButton } from "../../fenced-code/TextCopyButton";

export const SandpackFencedCodeClient = ({
    code,
    lang,
}: {
    code: string;
    lang: string;
}) => {
    return (
        <div className="md-sp-fenced-code">
            <TextCopyButton text={code} />
            <ScrollArea scrollbars="both">
                <HighlightedPre code={code} lang={lang} />
            </ScrollArea>
        </div>
    );
};
