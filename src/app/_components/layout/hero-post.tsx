import { Box, Grid, Text } from "@radix-ui/themes";
import { CornerUpRight } from "lucide-react";
import Link from "next/link";
import { Markdown } from "@/app/_components/markdown/md";
import type { Post } from "@/interfaces/post";

export function HeroPost({ slug, title, content }: Post) {
    return (
        <Grid className="relative overflow-hidden" rows="320px">
            <section>
                <div className="mb-8">
                    <Link
                        key={slug}
                        href={`/posts/${slug}`}
                        className="-outline-offset-8"
                    >
                        <Text
                            className="inline-flex w-full items-center justify-between text-balance font-extrabold leading-snug tracking-tighter"
                            size="9"
                        >
                            {title}
                            <CornerUpRight
                                size={60}
                                strokeLinecap="butt"
                                strokeWidth="3"
                            />
                        </Text>
                    </Link>
                </div>

                <article className="px-6" inert>
                    <Markdown source={content} />
                </article>
            </section>

            <Box className="expandable-box-gradient" />
        </Grid>
    );
}
