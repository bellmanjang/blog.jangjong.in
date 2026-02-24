"use server";

import { MarkdownAsync } from "react-markdown";
import { MermaidConfig } from "@/app/_components/config/MermaidConfig";
import { markdownOptions } from "@/app/_components/markdown/options";

type Props = {
    source: string;
};

export async function Markdown({ source }: Props) {
    return (
        <>
            <MermaidConfig />
            <div className="prose">
                <MarkdownAsync {...markdownOptions}>{source}</MarkdownAsync>
            </div>
        </>
    );
}
