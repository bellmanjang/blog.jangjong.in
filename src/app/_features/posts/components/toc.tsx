import { Tooltip } from "radix-ui";
import { extractTocFromMarkdown } from "@/app/_components/markdown/markdown-util";
import { TocRoot } from "@/app/_features/posts/components/toc-root";

export async function Toc({ source }: { source: string }) {
    const tocRoots = await extractTocFromMarkdown(source);

    return (
        <Tooltip.Provider
            delayDuration={300}
            skipDelayDuration={700}
            disableHoverableContent
        >
            <TocRoot tocRoots={tocRoots} />
        </Tooltip.Provider>
    );
}
