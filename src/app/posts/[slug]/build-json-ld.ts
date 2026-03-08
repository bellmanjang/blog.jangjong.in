import { parseISO } from "date-fns";
import type { Post } from "@/entities/post";

export function buildJsonLd(post: Post) {
    const encodedSlug = encodeURIComponent(post.slug);

    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: parseISO(post.publishedAt).toISOString(),
        dateModified: parseISO(post.lastModifiedAt).toISOString(),
        description: post.summary,
        image: `${process.env.BASE_URL}/og/posts/${encodedSlug}`,
        url: `${process.env.BASE_URL}/posts/${encodedSlug}`,
        author: {
            "@type": "Person",
            name: "Jang Jong-in",
            alternateName: "장종인",
            url: "https://jangjong.in",
        },
    });
}
