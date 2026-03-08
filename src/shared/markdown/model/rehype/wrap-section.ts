import type { Element, Root, RootContent } from "hast";
import type { Plugin } from "unified";
import { getHeadingLevel, HEADING_TAGS } from "./heading-id";

export const wrapSection: Plugin<[], Root> = () => {
    return tree => {
        const root = tree as Root;

        const out: RootContent[] = [];
        let currentSection: Element | null = null;

        const pushToOut = (node: RootContent) => {
            if (currentSection) {
                currentSection.children ??= [];
                currentSection.children.push(node as any);
            } else {
                out.push(node);
            }
        };

        for (const node of root.children ?? []) {
            if (node.type === "element" && HEADING_TAGS.has(node.tagName)) {
                const heading = node as Element;
                const level = getHeadingLevel(heading.tagName);
                const id = String((heading.properties as any)?.id ?? "");

                if (!id) {
                    pushToOut(node);
                    continue;
                }

                if (currentSection) out.push(currentSection as any);

                currentSection = {
                    type: "element",
                    tagName: "section",
                    properties: {
                        "data-toc-id": id,
                        "data-level": level,
                    },
                    children: [heading as any],
                };

                continue;
            }

            pushToOut(node);
        }

        if (currentSection) out.push(currentSection as any);
        root.children = out;
    };
};
