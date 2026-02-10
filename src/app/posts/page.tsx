import { Posts } from "@/app/_components/posts";
import { findAllPosts } from "@/lib/post-api";

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
