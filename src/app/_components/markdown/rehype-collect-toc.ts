import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import {
    getHeadingLevel,
    getTextContent,
    HEADING_TAGS,
} from "@/app/_components/markdown/rehype-heading-id";

export type TocItem = {
    depth: number;
    text: string;
    id: string;
};

export type TocNode = TocItem & { children: TocNode[] };

export const rehypeCollectToc: Plugin<[], Root> = () => {
    return (tree, file) => {
        const root: TocNode[] = [];
        const stack: TocNode[] = [];

        const pushNode = (node: TocNode) => {
            while (
                stack.length > 0 &&
                stack[stack.length - 1].depth >= node.depth
            ) {
                stack.pop();
            }

            if (stack.length === 0) root.push(node);
            else stack[stack.length - 1].children.push(node);

            stack.push(node);
        };

        const walk = (node: any) => {
            if (!node) return;

            if (node.type === "element") {
                const el = node as Element;

                if (HEADING_TAGS.has(el.tagName)) {
                    const depth = getHeadingLevel(el.tagName);
                    const text = getTextContent(el).trim();
                    const id: string | undefined = (el.properties as any)?.id;

                    if (id) pushNode({ depth, text, id, children: [] });
                }
            }

            if (Array.isArray(node.children)) {
                for (const child of node.children) walk(child);
            }
        };

        walk(tree);
        (file.data as any).toc = root;
    };
};
