import type { Element, Root } from "hast";
import type { Plugin } from "unified";

function slugify(str: any) {
    return str
        .toString()
        .toLowerCase()
        .trim() // Remove whitespace from both ends of a string
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/&/g, "-and-") // Replace & with 'and'
        .replace(/[^\w[가-힣]-]+/g, "") // Remove all non-word characters except for -
        .replace(/--+/g, "-"); // Replace multiple - with single -
}

function getTextContent(node: any): string {
    if (!node) return "";
    if (node.type === "text") return node.value ?? "";
    if (Array.isArray(node.children)) {
        return node.children.map(getTextContent).join("");
    }
    return "";
}

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export const rehypeHeadingId: Plugin<[], Root> = () => {
    const used = new Set<string>();

    return tree => {
        // DFS
        const walk = (node: any) => {
            if (!node) return;

            if (node.type === "element") {
                const el = node as Element;

                if (HEADING_TAGS.has(el.tagName)) {
                    const rawText = getTextContent(el);
                    const base = slugify(rawText) || "section";

                    let id = base;
                    let i = 2;

                    while (used.has(id)) {
                        id = `${base}-${i++}`;
                    }

                    used.add(id);

                    el.properties ??= {};
                    (el.properties as any).id = id;
                }
            }

            if (Array.isArray(node.children)) {
                for (const child of node.children) walk(child);
            }
        };

        walk(tree);
    };
};
