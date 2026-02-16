import type { Components } from "react-markdown";
import { FencedCode } from "@/app/_components/markdown/blocks/fenced-code/FencedCode";
import { MermaidBlock } from "@/app/_components/markdown/blocks/mermaid/MermaidBlock";

const LANG_RE = /language-(\w+)/;

export const preRenderer: Components["pre"] = props => {
    const child = props.children;

    if (!child || typeof child !== "object" || !("props" in (child as any))) {
        return <pre {...props} />;
    }

    const codeEl = child as React.ReactElement<
        React.HTMLAttributes<HTMLElement>
    >;
    const { children, className } = codeEl.props;

    const codeString = String(children ?? "").replace(/\n$/, "");
    const match = LANG_RE.exec(className ?? "");

    const lang = match?.[1] ?? "text";

    if (lang === "mermaid") {
        return <MermaidBlock code={codeString} />;
    }

    return <FencedCode code={codeString} lang={lang} />;
};
