"use server";

import { MarkdownAsync } from "react-markdown";
import { MermaidInitializer } from "@/app/_components/markdown/blocks/mermaid/MermaidInitializer";
import { markdownOptions } from "@/app/_components/markdown/options";

type Props = {
    source: string;
};

export async function Markdown({ source }: Props) {
    return (
        <>
            <MermaidInitializer />
            <MarkdownAsync {...markdownOptions}>{source}</MarkdownAsync>
        </>
    );
}
