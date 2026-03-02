import { useEffect, useMemo, useRef } from "react";
import { useTocStore } from "@/app/_features/posts/store/toc-store";

export const useTocAutoScroll = ({
    rootRef,
    tocOrderIds,
}: {
    rootRef: React.RefObject<HTMLUListElement | null>;
    tocOrderIds: string[];
}) => {
    const scrollRafRef = useRef<number | null>(null);
    const lastScrolledIdRef = useRef<string | null>(null);

    const headingsInView = useTocStore(state => state.headingsInView);
    const clickTocId = useTocStore(state => state.clickTocId);

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
            );
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
