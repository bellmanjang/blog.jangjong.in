import { HeroPost } from "@/app/_components/layout/hero-post";
import { findAllPosts, pickHero } from "@/app/_features/posts/api/post-api";
import { Posts } from "@/app/_features/posts/components/posts";

export default function Page() {
    const posts = findAllPosts();

    const { hero, rest } = pickHero(posts);

    return (
        <>
            {hero && <HeroPost {...hero} />}
            <div className="my-8">
                <Posts posts={rest} />
            </div>
        </>
    );
}
