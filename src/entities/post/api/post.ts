import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { safeDecodeURIComponent } from "@/shared/lib";
import type { Post } from "../model/types";

const postsDirectory = path.join(process.cwd(), "_posts");
const MARKDOWN_EXTENSION_RE = /\.md$/;

function getPostSlugs() {
    return fs
        .readdirSync(postsDirectory)
        .filter(file => path.extname(file) === ".md");
}

function readPostBySlug(slug: string): Post {
    const decoded = safeDecodeURIComponent(slug);
    const realSlug = decoded.replace(MARKDOWN_EXTENSION_RE, "");
    const fullPath = path.join(postsDirectory, `${realSlug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return { ...data, slug: realSlug, content } as Post;
}

export function readAllPosts() {
    const slugs = getPostSlugs();

    return (
        slugs
            .map(slug => readPostBySlug(slug))
            // publishedAt 기준 내림차순 정렬
            .sort((post1, post2) =>
                post1.publishedAt > post2.publishedAt ? -1 : 1,
            )
    );
}

export const getPostBySlug = cache(readPostBySlug);

export const findAllPosts = cache(readAllPosts);

export function pickHero(posts: Post[]) {
    if (posts.length === 0) return { hero: null, rest: [] };
    const idx = posts.findLastIndex(post => post.highlighted);
    if (idx < 0) return { hero: posts[0], rest: posts.slice(1) };
    return { hero: posts[idx], rest: posts.filter((_, i) => i !== idx) };
}
