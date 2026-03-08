"use client";

import { ExpandableBox } from "../../../../ui/expandable-box/ExpandableBox";
import { HighlightedPre } from "./HighlightedPre";
import { TextCopyButton } from "./TextCopyButton";

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
