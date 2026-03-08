import type { Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { normalizeText } from "./ko-ngram";

const HTML_TAG_RE = /<[^>]+>/g;
const IMG_TAG_RE = /<img\b[^>]*>/gi;
const IMG_ATTRIBUTE_RE =
    /\b(alt|title)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
const SCRIPT_STYLE_RE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const URL_TEXT_RE = /^(?:https?:\/\/|www\.)\S+$/i;

type MarkdownNode = Root | RootContent;
type ParentNode = MarkdownNode & { children: MarkdownNode[] };

const markdownTextProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath);

function hasChildren(node: MarkdownNode): node is ParentNode {
    return "children" in node && Array.isArray(node.children);
}

function stripHtmlTags(html: string) {
    return html.replace(SCRIPT_STYLE_RE, " ").replace(HTML_TAG_RE, " ");
}

function isLinkText(text: string) {
    return URL_TEXT_RE.test(text);
}

function collectImageText(parts: Array<string | null | undefined>) {
    return parts
        .map(part => normalizeText(part ?? ""))
        .filter(text => text && !isLinkText(text))
        .join(" ");
}

function extractHtmlImageText(html: string) {
    const imageTexts: string[] = [];

    for (const tag of html.match(IMG_TAG_RE) ?? []) {
        for (const match of tag.matchAll(IMG_ATTRIBUTE_RE)) {
            const value = match[2] ?? match[3] ?? match[4] ?? "";
            const text = normalizeText(value);

            if (text && !isLinkText(text)) {
                imageTexts.push(text);
            }
        }
    }

    return imageTexts.join(" ");
}

function collectChildrenText(children: MarkdownNode[]) {
    return children.map(collectNodeText).join(" ");
}

function collectNodeText(node: MarkdownNode): string {
    switch (node.type) {
        case "root":
            return collectChildrenText(node.children as MarkdownNode[]);
        case "text":
        case "inlineCode":
            return node.value;
        case "break":
            return " ";
        case "link":
        case "linkReference": {
            const text = normalizeText(
                collectChildrenText(node.children as MarkdownNode[]),
            );
            return isLinkText(text) ? "" : text;
        }
        case "html": {
            const imageText = extractHtmlImageText(node.value);
            const text = normalizeText(stripHtmlTags(node.value));
            const mergedText = normalizeText([imageText, text].join(" "));

            return isLinkText(mergedText) ? "" : mergedText;
        }
        case "image":
        case "imageReference":
            return collectImageText([
                node.alt,
                "title" in node ? node.title : "",
            ]);
        case "code":
        case "math":
        case "inlineMath":
            return "";
        default:
            if (hasChildren(node)) {
                return collectChildrenText(node.children);
            }

            return "";
    }
}

export function stripMarkdown(md: string) {
    const tree = markdownTextProcessor.parse(md) as Root;
    return normalizeText(collectNodeText(tree));
}
