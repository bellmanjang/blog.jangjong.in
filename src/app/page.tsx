import { findAllPosts, pickHero } from "@/entities/post";
import { HomeVisitorStats } from "@/features/analytics";
import { HeroArticle, List } from "@/widgets/post";

export default function Page() {
    const posts = findAllPosts();

    const { hero, rest } = pickHero(posts);

    return (
        <>
            {hero && <HeroArticle {...hero} />}
            <div className="my-8">
                <List posts={rest} />
            </div>
            <HomeVisitorStats />
        </>
    );
}
