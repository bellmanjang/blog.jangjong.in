import { Tooltip } from "radix-ui";
import { extractTocFromMarkdown } from "@/shared/markdown";
import { TocRoot } from "./TocRoot";

export async function TocSidebar({ source }: { source: string }) {
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
