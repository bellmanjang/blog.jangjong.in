import { Box, Grid, Text } from "@radix-ui/themes";
import Link from "next/link";
import type { Post } from "@/entities/post";
import { cx } from "@/shared/lib";
import { Markdown } from "@/shared/markdown";
import styles from "./HeroArticle.module.scss";

export function HeroArticle({ slug, title, content }: Post) {
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
                            className="w-full text-balance font-extrabold leading-snug tracking-tighter"
                            size="9"
                        >
                            {title}
                        </Text>
                    </Link>
                </div>

                <article className="px-6" inert>
                    <Markdown source={content} />
                </article>
            </section>

            <Box
                className={cx(
                    styles.gradient,
                    "absolute right-0 bottom-0 left-0 h-[160px] p-3",
                )}
            />
        </Grid>
    );
}
