import type { Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { headingAnchor } from "../model/rehype/heading-anchor";
import { headingId } from "../model/rehype/heading-id";
import { listDepth } from "../model/rehype/list-depth";
import { wrapSection } from "../model/rehype/wrap-section";
import { sandpack } from "../model/remark/sandpack";
import { blockquoteRenderer } from "../ui/renderers/Blockquote";
import { preRenderer } from "../ui/renderers/FencedCode";
import { createHeadingRenderer } from "../ui/renderers/Headings";
import { imgRenderer } from "../ui/renderers/Img";
import { inlineCodeRenderer } from "../ui/renderers/InlineCode";
import { inputRenderer } from "../ui/renderers/Input";
import { linkRenderer } from "../ui/renderers/Link";
import { paragraphRenderer } from "../ui/renderers/Paragraph";
import { sandpackRenderer } from "../ui/renderers/Sandpack";
import { tableRenderer } from "../ui/renderers/Table";

export const markdownOptions: Pick<
    Options,
    "remarkPlugins" | "rehypePlugins" | "components"
> = {
    remarkPlugins: [remarkGfm, remarkMath, sandpack],
    rehypePlugins: [
        rehypeRaw,
        rehypeKatex,
        headingId,
        headingAnchor,
        wrapSection,
        listDepth,
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
