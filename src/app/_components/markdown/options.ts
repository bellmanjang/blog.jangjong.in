import type { Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { blockquoteRenderer } from "@/app/_components/markdown/renderers/blockquote";
import { imgRenderer } from "@/app/_components/markdown/renderers/img";
import { codeRenderer } from "./renderers/code";

export const markdownOptions: Pick<
    Options,
    "remarkPlugins" | "rehypePlugins" | "components"
> = {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeRaw, rehypeKatex],
    components: {
        blockquote: blockquoteRenderer,
        code: codeRenderer,
        img: imgRenderer,
    },
};
