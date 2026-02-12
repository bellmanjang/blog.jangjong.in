import type { Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { rehypeHeadingId } from "@/app/_components/markdown/rehype-heading-id";
import { rehypeListDepth } from "@/app/_components/markdown/rehype-list-depth";
import { blockquoteRenderer } from "@/app/_components/markdown/renderers/blockquote";
import { codeRenderer } from "@/app/_components/markdown/renderers/code";
import { createHeadingRenderer } from "@/app/_components/markdown/renderers/headings";
import { imgRenderer } from "@/app/_components/markdown/renderers/img";
import { inputRenderer } from "@/app/_components/markdown/renderers/input";
import { linkRenderer } from "@/app/_components/markdown/renderers/link";
import { paragraphRenderer } from "@/app/_components/markdown/renderers/paragraph";
import { tableRenderer } from "@/app/_components/markdown/renderers/table";

export const markdownOptions: Pick<
    Options,
    "remarkPlugins" | "rehypePlugins" | "components"
> = {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeRaw, rehypeKatex, rehypeHeadingId, rehypeListDepth],
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
        code: codeRenderer,
        img: imgRenderer,
        input: inputRenderer, // Task list items checkbox
        table: tableRenderer.table,
        thead: tableRenderer.thead,
        tbody: tableRenderer.tbody,
        tr: tableRenderer.tr,
        th: tableRenderer.th,
        td: tableRenderer.td,
    },
};
