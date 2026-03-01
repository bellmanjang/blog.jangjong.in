import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { type PluggableList, unified } from "unified";
import { VFile } from "vfile";
import { markdownOptions } from "@/app/_components/markdown/options";
import type { TocNode } from "@/app/_components/markdown/rehype-collect-toc";

function applyPlugins(
    p: ReturnType<typeof unified>,
    plugins: PluggableList | null | undefined,
) {
    if (!plugins || plugins.length === 0) return;

    for (const plugin of plugins) p.use(plugin as any);
}

export async function extractTocFromMarkdown(
    source: string,
): Promise<TocNode[]> {
    const p = unified();

    p.use(remarkParse);
    applyPlugins(p, markdownOptions.remarkPlugins);

    p.use(remarkRehype, { allowDangerousHtml: true });
    applyPlugins(p, markdownOptions.rehypePlugins);

    const tree = p.parse(source);

    const file = new VFile({ value: source });
    await p.run(tree, file);

    return (file.data as any).toc ?? [];
}
