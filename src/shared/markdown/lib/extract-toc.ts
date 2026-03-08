import { VFile } from "vfile";
import type { HeadingNode } from "../types";
import { createTocProcessor } from "./unified/create-toc-processor";

export async function extractTocFromMarkdown(
    source: string,
): Promise<HeadingNode[]> {
    const processor = createTocProcessor();
    const tree = processor.parse(source);
    const file = new VFile({ value: source });

    await processor.run(tree, file);
    return (file.data as any).toc ?? [];
}
