import { findAllPosts } from "@/lib/post-api";

export default async function sitemap() {
    const posts = findAllPosts().map(post => ({
        url: `${process.env.BASE_URL}/posts/${post.slug}`,
        lastModified: post.lastModifiedAt,
    }));

    const routes = ["", "/posts"].map(route => ({
        url: `${process.env.BASE_URL}${route}`,
        lastModified: new Date().toISOString().split("T")[0],
    }));

    return [...routes, ...posts];
}
