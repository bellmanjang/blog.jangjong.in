import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { collectHeadingTree } from "../../model/rehype/collect-heading-tree";
import { headingId } from "../../model/rehype/heading-id";

export function createTocProcessor() {
    const processor = unified();

    processor.use(remarkParse);
    processor.use(remarkRehype, { allowDangerousHtml: true });
    processor.use(headingId);
    processor.use(collectHeadingTree);

    return processor;
}
