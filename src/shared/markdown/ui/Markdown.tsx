import "./Markdown.scss";
import { MarkdownAsync } from "react-markdown";
import { MermaidConfig } from "../../config/MermaidConfig";
import { markdownOptions } from "../lib/options";

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
