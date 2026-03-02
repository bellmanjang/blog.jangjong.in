import type { Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { rehypeCollectToc } from "@/app/_components/markdown/rehype-collect-toc";
import { rehypeHeadingAnchor } from "@/app/_components/markdown/rehype-heading-anchor";
import { rehypeHeadingId } from "@/app/_components/markdown/rehype-heading-id";
import { rehypeListDepth } from "@/app/_components/markdown/rehype-list-depth";
import { rehypeWrapSections } from "@/app/_components/markdown/rehype-wrap-sections";
import { remarkSandpack } from "@/app/_components/markdown/remark-sandpack";
import { blockquoteRenderer } from "@/app/_components/markdown/renderers/blockquote";
import { preRenderer } from "@/app/_components/markdown/renderers/fenced-code";
import { createHeadingRenderer } from "@/app/_components/markdown/renderers/headings";
import { imgRenderer } from "@/app/_components/markdown/renderers/img";
import { inlineCodeRenderer } from "@/app/_components/markdown/renderers/inline-code";
import { inputRenderer } from "@/app/_components/markdown/renderers/input";
import { linkRenderer } from "@/app/_components/markdown/renderers/link";
import { paragraphRenderer } from "@/app/_components/markdown/renderers/paragraph";
import { sandpackRenderer } from "@/app/_components/markdown/renderers/sandpack";
import { tableRenderer } from "@/app/_components/markdown/renderers/table";

export const markdownOptions: Pick<
    Options,
    "remarkPlugins" | "rehypePlugins" | "components"
> = {
    remarkPlugins: [remarkGfm, remarkMath, remarkSandpack],
    rehypePlugins: [
        rehypeRaw,
        rehypeKatex,
        rehypeHeadingId,
        rehypeHeadingAnchor,
        rehypeWrapSections,
        rehypeCollectToc,
        rehypeListDepth,
    ],
    components: {
        h1: createHeadingRenderer(1),
        h2: createHeadingRenderer(2),
        h3: createHeadingRenderer(3),
        h4: createHeadingRenderer(4),
        h5: createHeadingRenderer(5),
        h6: createHeadingRenderer(6),
        a: linkRenderer,
        p: paragraphRenderer,
        blockquote: blockquoteRenderer,
        code: inlineCodeRenderer,
        pre: preRenderer,
        img: imgRenderer,
        input: inputRenderer, // Task list items checkbox
        table: tableRenderer.table,
        thead: tableRenderer.thead,
        tbody: tableRenderer.tbody,
        tr: tableRenderer.tr,
        th: tableRenderer.th,
        td: tableRenderer.td,
        sandpack: sandpackRenderer,
    },
};
