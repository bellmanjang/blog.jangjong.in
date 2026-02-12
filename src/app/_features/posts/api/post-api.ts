import { parseISO } from "date-fns";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import type { Post } from "@/interfaces/post";

const postsDirectory = path.join(process.cwd(), "_posts");

export function getPostSlugs() {
    return fs
        .readdirSync(postsDirectory)
        .filter(file => path.extname(file) === ".md");
}

export function getPostBySlug(slug: string): Post {
    const realSlug = slug.replace(/\.md$/, "");
    const fullPath = path.join(postsDirectory, `${realSlug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return { ...data, slug: realSlug, content } as Post;
}

export function findAllPosts() {
    const slugs = getPostSlugs();

    return (
        slugs
            .map(slug => getPostBySlug(slug))
            // publishedAt 기준 내림차순 정렬
            .sort((post1, post2) =>
                post1.publishedAt > post2.publishedAt ? -1 : 1,
            )
    );
}

export function pickHero(posts: Post[]) {
    if (posts.length === 0) return { hero: null, rest: [] };
    const idx = posts.findLastIndex(post => post.highlighted);
    if (idx < 0) return { hero: posts[0], rest: posts.slice(1) };
    return { hero: posts[idx], rest: posts.filter((_, i) => i !== idx) };
}

export function buildJsonLd(post: Post) {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: parseISO(post.publishedAt).toISOString(),
        dateModified: parseISO(post.lastModifiedAt).toISOString(),
        description: post.summary,
        image: `${process.env.BASE_URL}/og/posts/${post.slug}`,
        url: `${process.env.BASE_URL}/posts/${post.slug}`,
        author: {
            "@type": "Person",
            name: "Jang Jong-in",
            alternateName: "장종인",
            url: "https://jangjong.in",
        },
    });
}
