import type { Element, Root } from "hast";
import type { Plugin } from "unified";

type Options = {
    modulo?: number; // depth % modulo
    attribute?: string; // data-*
    includeOrdered?: boolean;
    includeUnordered?: boolean;
};

export const rehypeListDepth: Plugin<[Options?], Root> = opts => {
    const {
        modulo = 4,
        attribute = "data-depth",
        includeOrdered = true,
        includeUnordered = true,
    } = opts ?? {};

    return tree => {
        const walk = (node: any, listDepth: number) => {
            if (!node) return;

            const isElement = node.type === "element";
            const tag = isElement ? (node as Element).tagName : null;

            const isUl = tag === "ul";
            const isOl = tag === "ol";
            const isList =
                (includeUnordered && isUl) || (includeOrdered && isOl);

            let nextDepth = listDepth;

            if (isList) {
                const depthMod = ((listDepth % modulo) + modulo) % modulo;

                const el = node as Element;
                el.properties ??= {};
                (el.properties as any)[attribute] = String(depthMod);

                nextDepth = listDepth + 1;
            }

            if (Array.isArray(node.children)) {
                for (const child of node.children) walk(child, nextDepth);
            }
        };

        walk(tree, 0);
    };
};
