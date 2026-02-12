import { findAllPosts } from "@/app/_features/posts/api/post-api";
import { Posts } from "@/app/_features/posts/components/posts";

export const metadata = {
    title: "Posts",
};

export default function PostsPage() {
    const posts = findAllPosts();

    return (
        <section>
            <Posts posts={posts} />
        </section>
    );
}
