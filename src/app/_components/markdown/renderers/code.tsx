import { Code } from "@radix-ui/themes";
import type { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ExpandableBox } from "@/app/_components/expandable-box";
import { MermaidBlock } from "@/app/_components/markdown/blocks/MermaidBlock";

const LANG_RE = /language-(\w+)/;

export const codeRenderer: Components["code"] = props => {
    const { children, className } = props;

    const codeString = String(children ?? "").replace(/\n$/, "");
    const match = LANG_RE.exec(className ?? "");

    if (match) {
        const lang = match[1];

        if (lang === "mermaid") {
            return <MermaidBlock code={codeString} />;
        }

        return (
            <ExpandableBox>
                <SyntaxHighlighter
                    className={"!m-0 !bg-transparent"}
                    PreTag="div"
                    language={lang}
                    showLineNumbers
                >
                    {codeString}
                </SyntaxHighlighter>
            </ExpandableBox>
        );
    }

    return <Code variant="outline">{children}</Code>;
};
