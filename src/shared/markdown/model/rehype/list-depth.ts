import type { Element, Root } from "hast";
import type { Plugin } from "unified";

type Options = {
    modulo?: number;
    attribute?: string;
    includeOrdered?: boolean;
    includeUnordered?: boolean;
};

export const listDepth: Plugin<[Options?], Root> = opts => {
    const {
        modulo = 4,
        attribute = "data-depth",
        includeOrdered = true,
        includeUnordered = true,
    } = opts ?? {};

    return tree => {
        const walk = (node: any, depth: number) => {
            if (!node) return;

            const isElement = node.type === "element";
            const tag = isElement ? (node as Element).tagName : null;

            const isUnordered = tag === "ul";
            const isOrdered = tag === "ol";
            const isList =
                (includeUnordered && isUnordered) ||
                (includeOrdered && isOrdered);

            let nextDepth = depth;

            if (isList) {
                const depthMod = ((depth % modulo) + modulo) % modulo;
                const el = node as Element;
                el.properties ??= {};
                (el.properties as any)[attribute] = String(depthMod);
                nextDepth = depth + 1;
            }

            if (Array.isArray(node.children)) {
                for (const child of node.children) walk(child, nextDepth);
            }
        };

        walk(tree, 0);
    };
};
