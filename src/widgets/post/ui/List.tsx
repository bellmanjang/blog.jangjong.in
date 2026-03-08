import { Text } from "@radix-ui/themes";
import Link from "next/link";
import type { Post } from "@/entities/post";
import { cx, formatDate } from "@/shared/lib";
import styles from "./List.module.scss";

export type PostListItem = Pick<Post, "slug" | "publishedAt" | "title">;

type YearGroup = {
    posts: PostListItem[];
    year: string;
};

type ListVariant = "archive" | "search";

function comparePostsByPublishedAtDesc(a: PostListItem, b: PostListItem) {
    return (
        b.publishedAt.localeCompare(a.publishedAt) ||
        a.slug.localeCompare(b.slug)
    );
}

function groupPostsByYear(posts: PostListItem[]): YearGroup[] {
    const postsByYear = new Map<string, PostListItem[]>();

    for (const post of posts) {
        const year = post.publishedAt.slice(0, 4);
        const postsInYear = postsByYear.get(year);

        if (postsInYear) {
            postsInYear.push(post);
            continue;
        }

        postsByYear.set(year, [post]);
    }

    return [...postsByYear.entries()]
        .sort(([leftYear], [rightYear]) => Number(rightYear) - Number(leftYear))
        .map(([year, postsInYear]) => ({
            year,
            posts: [...postsInYear].sort(comparePostsByPublishedAtDesc),
        }));
}

function TreeBranch({ isLast }: { isLast: boolean }) {
    return (
        <span aria-hidden="true" className={styles.branch}>
            <span
                className={cx(
                    styles.branch_stem,
                    isLast ? styles.branch_stem_half : styles.branch_stem_full,
                )}
            />
            <span className={styles.branch_horizontal} />
        </span>
    );
}

function PostLink({ isLast, post }: { isLast: boolean; post: PostListItem }) {
    return (
        <li>
            <Link className={styles.link} href={`/posts/${post.slug}`}>
                <TreeBranch isLast={isLast} />
                <span className={styles.content}>
                    <Text className={styles.title}>{post.title}</Text>
                    <Text className={styles.date} size="1" color="gray">
                        {formatDate(post.publishedAt)}
                    </Text>
                </span>
            </Link>
        </li>
    );
}

function SearchList({ posts }: { posts: PostListItem[] }) {
    return (
        <div className={styles.list}>
            <section className={styles.group}>
                <Text
                    as="p"
                    className={cx(
                        styles.group_label,
                        styles.group_label_placeholder,
                    )}
                >
                    &nbsp;
                </Text>
                <ul className={styles.items}>
                    {posts.map((post, index) => (
                        <PostLink
                            key={post.slug}
                            isLast={index === posts.length - 1}
                            post={post}
                        />
                    ))}
                </ul>
            </section>
        </div>
    );
}

function ArchiveList({ posts }: { posts: PostListItem[] }) {
    const yearGroups = groupPostsByYear(posts);

    return (
        <div className={styles.list}>
            {yearGroups.map(group => (
                <section key={group.year} className={styles.group}>
                    <Text as="p" className={styles.group_label}>
                        {group.year}
                    </Text>
                    <ul className={styles.items}>
                        {group.posts.map((post, index) => (
                            <PostLink
                                key={post.slug}
                                isLast={index === group.posts.length - 1}
                                post={post}
                            />
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

export function List({
    posts,
    variant = "archive",
}: {
    posts: PostListItem[];
    variant?: ListVariant;
}) {
    if (variant === "search") {
        return <SearchList posts={posts} />;
    }

    return <ArchiveList posts={posts} />;
}
