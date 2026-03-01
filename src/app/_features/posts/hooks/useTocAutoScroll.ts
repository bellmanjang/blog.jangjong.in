import { useEffect, useMemo, useRef } from "react";
import type { TocNode } from "@/app/_components/markdown/rehype-collect-toc";
import { useTocStore } from "@/app/_features/posts/store/toc-store";
import { flattenTocIds } from "@/app/_features/posts/util/toc-util";

export const useTocAutoScroll = ({
    rootRef,
    tocRoots,
}: {
    rootRef: React.RefObject<HTMLUListElement | null>;
    tocRoots: TocNode[];
}) => {
    const scrollRafRef = useRef<number | null>(null);
    const lastScrolledIdRef = useRef<string | null>(null);

    const headingsInView = useTocStore(state => state.headingsInView);
    const clickTocId = useTocStore(state => state.clickTocId);

    const tocOrderIds = useMemo(() => flattenTocIds(tocRoots), [tocRoots]);

    const activeId = useMemo(() => {
        if (clickTocId) return clickTocId;

        for (const id of tocOrderIds) {
            if (headingsInView.has(id)) return id;
        }
        return null;
    }, [clickTocId, tocOrderIds, headingsInView]);

    useEffect(() => {
        if (!activeId) return;
        if (lastScrolledIdRef.current === activeId) return;

        if (scrollRafRef.current !== null)
            cancelAnimationFrame(scrollRafRef.current);

        scrollRafRef.current = requestAnimationFrame(() => {
            const rootEl = rootRef.current;
            if (!rootEl) return;

            const target = rootEl.querySelector(
                `a[data-toc-id="${CSS.escape(activeId)}"]`,
            ) as HTMLElement | null;
            if (!target) return;

            target.scrollIntoView({ block: "center", behavior: "smooth" });
            lastScrolledIdRef.current = activeId;
            scrollRafRef.current = null;
        });

        return () => {
            if (scrollRafRef.current !== null) {
                cancelAnimationFrame(scrollRafRef.current);
            }
            scrollRafRef.current = null;
        };
    }, [activeId]);
};
