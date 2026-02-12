import { Text } from "@radix-ui/themes";
import Link from "next/link";
import type { Post } from "@/interfaces/post";
import { formatDate } from "@/lib/utils/date-util";

export function Posts({ posts }: { posts: Post[] }) {
    return (
        <div>
            {posts.map(post => (
                <Link
                    key={post.slug}
                    className="mb-4 flex flex-col space-y-1"
                    href={`/posts/${post.slug}`}
                >
                    <div className="flex w-full flex-col gap-2 space-x-0 md:flex-row md:space-x-2">
                        <Text className="w-[120px] tabular-nums" color="gray">
                            {formatDate(post.publishedAt)}
                        </Text>
                        <Text>{post.title}</Text>
                    </div>
                </Link>
            ))}
        </div>
    );
}
