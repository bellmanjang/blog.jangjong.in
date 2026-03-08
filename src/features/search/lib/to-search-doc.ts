import type { Post } from "@/entities/post";
import type { SearchDoc } from "../model/types";
import { koBigramTokens, normalizeText } from "./ko-ngram";
import { stripMarkdown } from "./strip-markdown";

export function toSearchDoc(post: Post): SearchDoc {
    const title = normalizeText(post.title);
    const summary = normalizeText(post.summary);
    const tags = (post.tags ?? []).map(normalizeText);
    const bodyText = stripMarkdown(post.content);

    return {
        slug: post.slug,
        title,
        summary,
        tags,
        publishedAt: post.publishedAt,
        lastModifiedAt: post.lastModifiedAt,
        highlighted: Boolean(post.highlighted),

        titleTokens: koBigramTokens(title),
        summaryTokens: koBigramTokens(summary),
        tagsTokens: koBigramTokens(tags.join(" ")),
        bodyTokens: koBigramTokens(bodyText),
    };
}
