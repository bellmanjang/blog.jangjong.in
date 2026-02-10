import { HeroPost } from "@/app/_components/hero-post";
import { Posts } from "@/app/_components/posts";
import { findAllPosts, pickHero } from "@/lib/post-api";

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
