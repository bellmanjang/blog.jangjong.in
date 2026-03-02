import type { Element, Root, RootContent } from "hast";
import type { Plugin } from "unified";
import {
    getHeadingLevel,
    HEADING_TAGS,
} from "@/app/_components/markdown/rehype-heading-id";

export const rehypeWrapSections: Plugin<[], Root> = () => {
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

                // id 없는 heading이면 section을 못 만드니, 그냥 기존 흐름대로 넣음
                if (!id) {
                    pushToOut(node);
                    continue;
                }

                // 새 섹션 시작: 이전 섹션은 out에 확정(push)
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

        // 마지막 섹션 flush
        if (currentSection) out.push(currentSection as any);

        root.children = out;
    };
};
