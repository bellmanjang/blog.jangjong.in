import { Box, Grid, Text } from "@radix-ui/themes";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Markdown } from "@/app/_components/markdown/md";
import type { Post } from "@/interfaces/post";

export function HeroPost({ slug, title, content }: Post) {
    return (
        <Grid className="relative overflow-hidden" rows="320px">
            <section>
                <div className="mb-8">
                    <Link key={slug} href={`/posts/${slug}`}>
                        <Text
                            className="!tracking-tighter mb-8 inline-flex w-full items-center justify-between text-balance font-extrabold"
                            size="9"
                        >
                            {title}
                            <ArrowRight
                                size={60}
                                strokeLinecap="butt"
                                strokeWidth="2.75"
                            />
                        </Text>
                    </Link>
                </div>

                <article className="prose">
                    <Markdown source={content} />
                </article>
            </section>

            <Box className="expandable-box-gradient" />
        </Grid>
    );
}
