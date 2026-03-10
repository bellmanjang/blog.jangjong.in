import { parseISO } from "date-fns";
import type { Post } from "../model/types";

type PostMetadataUrls = {
    postUrl: string;
    ogImageUrl: string;
};

export function buildPostMetadataUrls(
    baseUrl: string,
    slug: string,
): PostMetadataUrls {
    const encodedSlug = encodeURIComponent(slug);

    return {
        postUrl: `${baseUrl}/posts/${encodedSlug}`,
        ogImageUrl: `${baseUrl}/og/posts/${encodedSlug}`,
    };
}

export function buildPostJsonLd(post: Post, baseUrl: string) {
    const { postUrl, ogImageUrl } = buildPostMetadataUrls(baseUrl, post.slug);

    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: parseISO(post.publishedAt).toISOString(),
        dateModified: parseISO(post.lastModifiedAt).toISOString(),
        description: post.summary,
        image: ogImageUrl,
        url: postUrl,
        author: {
            "@type": "Person",
            name: "Jang Jong-in",
            alternateName: "장종인",
            url: "https://jangjong.in",
        },
    });
}
