"use client";

import { HighlightedPre } from "@/app/_components/markdown/blocks/fenced-code/HighlightedPre";
import { TextCopyButton } from "@/app/_components/markdown/blocks/fenced-code/TextCopyButton";
import { ExpandableBox } from "@/app/_components/ui/expandable-box";

export const FencedCodeClient = ({
    code,
    lang,
}: {
    code: string;
    lang: string;
}) => {
    return (
        <div className="md-fenced-code">
            <TextCopyButton text={code} />

            <ExpandableBox>
                <HighlightedPre code={code} lang={lang} />
            </ExpandableBox>
        </div>
    );
};
