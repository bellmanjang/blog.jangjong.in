import { useEffect } from "react";
import { useTocStore } from "@/app/_features/posts/store/toc-store";

export const useSectionObserver = ({
    tocOrderIds,
}: {
    tocOrderIds: string[];
}) => {
    const observer = useTocStore(s => s.headingsObserver);

    useEffect(() => {
        if (!observer) return;

        const post = document.querySelector(".post");
        if (!post) return;

        const targets = tocOrderIds
            .map(id =>
                post.querySelector(`section[data-toc-id="${CSS.escape(id)}"]`),
            )
            .filter(Boolean) as Element[];

        for (const t of targets) observer.observe(t);

        return () => {
            for (const t of targets) observer.unobserve(t);
        };
    }, [observer, tocOrderIds]);
};
