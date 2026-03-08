import { Text } from "@radix-ui/themes";
import { parseISO } from "date-fns";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { findAllPosts, getPostBySlug } from "@/entities/post";
import { formatDate, safeDecodeURIComponent } from "@/shared/lib";
import { Article } from "@/widgets/post";
import { buildJsonLd } from "./build-json-ld";

export const dynamicParams = false;

type Params = {
    params: Promise<{ slug: string }>;
};

export default async function PostPage(props: Params) {
    const params = await props.params;
    const slug = decodeURIComponent(params.slug);

    const post = getPostBySlug(slug);

    if (!post) return notFound();

    return (
        <section>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: buildJsonLd(post) }}
            />

            <Text
                className="inline-flex w-full items-center justify-between text-balance font-extrabold leading-snug tracking-tighter"
                size="9"
            >
                {post.title}
            </Text>
            <div className="mt-2 mb-8 px-1">
                <Text size="2" color="gray">
                    {formatDate(post.publishedAt)}
                </Text>
            </div>
            <Article post={post} />
        </section>
    );
}

export async function generateMetadata(
    props: Params,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    const { slug: rawSlug } = await props.params;

    const slug = safeDecodeURIComponent(rawSlug);
    const encodedSlug = encodeURIComponent(slug);

    const post = getPostBySlug(slug);

    if (!post) return notFound();

    const { title, summary, publishedAt, lastModifiedAt } = post;

    const ogImageUrl = `${process.env.BASE_URL}/og/posts/${encodedSlug}`;
    const previousImages = (await parent).openGraph?.images || [];

    return {
        title,
        description: summary,
        openGraph: {
            title,
            description: summary,
            type: "article",
            publishedTime: parseISO(publishedAt).toISOString(),
            modifiedTime: parseISO(lastModifiedAt).toISOString(),
            url: `${process.env.BASE_URL}/posts/${encodedSlug}`,
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
