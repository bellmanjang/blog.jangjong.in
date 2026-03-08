import "./Ariticle.scss";
import type { Post as PostType } from "@/entities/post";
import {
    ClickTocIdResetter,
    HashScroller,
    TocSidebar,
} from "@/features/post-toc";
import { Markdown } from "@/shared/markdown";

export const Article = ({ post }: { post: PostType }) => {
    return (
        <article className="article relative px-6">
            <ClickTocIdResetter />
            <HashScroller />
            <Markdown source={post.content} />
            <TocSidebar source={post.content} />
        </article>
    );
};
