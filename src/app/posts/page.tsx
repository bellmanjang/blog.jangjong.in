import type { Metadata } from "next";
import { findAllPosts } from "@/entities/post";
import { SearchableList } from "@/widgets/post";

export const metadata: Metadata = {
    title: "Posts",
};

export default function PostsPage() {
    const posts = findAllPosts();

    return (
        <section>
            <SearchableList posts={posts} />
        </section>
    );
}
