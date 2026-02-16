"use server";

import { MarkdownAsync } from "react-markdown";
import { markdownOptions } from "@/app/_components/markdown/options";

type Props = {
    source: string;
};

export async function Markdown({ source }: Props) {
    return <MarkdownAsync {...markdownOptions}>{source}</MarkdownAsync>;
}
