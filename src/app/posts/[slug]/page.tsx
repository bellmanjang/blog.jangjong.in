import { Text } from "@radix-ui/themes";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Markdown } from "@/app/_components/md";
import { formatDate } from "@/lib/date-util";
import { buildJsonLd, findAllPosts, getPostBySlug } from "@/lib/post-api";

const getCachedPostBySlug = cache(getPostBySlug);

export const dynamicParams = false;

type Params = {
    params: Promise<{ slug: string }>;
};

export default async function PostPage(props: Params) {
    const params = await props.params;
    const slug = decodeURIComponent(params.slug);

    const post = getCachedPostBySlug(slug);

    if (!post) return notFound();

    return (
        <section>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: buildJsonLd(post) }}
            />

            <Text
                className="!tracking-tighter mb-8 text-balance font-extrabold"
                size="9"
            >
                {post.title}
            </Text>
            <div className="mt-2 mb-8">
                <Text size="2" color="gray">
                    {formatDate(post.publishedAt)}
                </Text>
            </div>
            <article className="prose">
                <Markdown source={post.content} />
            </article>
        </section>
    );
}

export async function generateMetadata(
    props: Params,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    const params = await props.params;
    const slug = decodeURIComponent(params.slug);

    const post = getCachedPostBySlug(slug);

    if (!post) return notFound();

    const { title, summary, publishedAt } = post;

    const ogImageUrl = `${process.env.BASE_URL}/og/posts/${post.slug}`;
    const previousImages = (await parent).openGraph?.images || [];

    return {
        title,
        description: summary,
        openGraph: {
            title,
            description: summary,
            type: "article",
            publishedTime: publishedAt,
            url: `${process.env.BASE_URL}/posts/${post.slug}`,
            images: [
                {
                    url: ogImageUrl,
                },
                ...previousImages,
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: summary,
            images: [ogImageUrl],
        },
    };
}

export async function generateStaticParams() {
    const posts = findAllPosts();

    return posts.map(post => ({
        slug: post.slug,
    }));
}
