import type { Element, Root } from "hast";
import type { Plugin } from "unified";
import { HEADING_TAGS } from "@/app/_components/markdown/rehype-heading-id";

export const rehypeHeadingAnchor: Plugin<[], Root> = () => {
    return tree => {
        const walk = (node: any) => {
            if (!node) return;

            if (node.type === "element") {
                const el = node as Element;

                if (HEADING_TAGS.has(el.tagName)) {
                    const id = String((el.properties as any)?.id ?? "");
                    if (!id) return;

                    const origChildren = el.children ?? [];
                    el.children = [
                        {
                            type: "element",
                            tagName: "a",
                            properties: {
                                href: `#${id}`,
                            },
                            children: [...origChildren],
                        },
                    ];
                }
            }

            if (Array.isArray(node.children)) {
                for (const child of node.children) walk(child);
            }
        };

        walk(tree);
    };
};
