"use client";

import { ScrollArea } from "@radix-ui/themes";
import { useEffect, useMemo, useRef } from "react";
import type { TocNode } from "@/app/_components/markdown/rehype-collect-toc";
import { TocItem } from "@/app/_features/posts/components/toc-item";
import { useTocStore } from "@/app/_features/posts/store/toc-store";
import {
    buildTocLineMeta,
    flattenTocIds,
} from "@/app/_features/posts/util/toc-util";

export function TocRoot({ tocRoots }: { tocRoots: TocNode[] }) {
    const headingsInView = useTocStore(state => state.headingsInView);
    const hoverTocId = useTocStore(state => state.hoverTocId);
    const clickTocId = useTocStore(state => state.clickTocId);
    const clear = useTocStore(state => state.clear);
    const initializeFeedObserver = useTocStore(
        state => state.initializeFeedObserver,
    );
    const updateHoverTocId = useTocStore(state => state.updateHoverTocId);

    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastScrolledIdRef = useRef<string | null>(null);

    useEffect(() => {
        initializeFeedObserver();

        return () => clear();
    }, [initializeFeedObserver, clear]);

    const meta = useMemo(
        () => buildTocLineMeta(tocRoots, headingsInView, hoverTocId),
        [tocRoots, headingsInView, hoverTocId],
    );

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

        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            const rootEl = scrollAreaRef.current;
            if (!rootEl) return;

            const target = rootEl.querySelector(
                `[data-toc-id="${CSS.escape(activeId)}"]`,
            ) as HTMLElement | null;
            if (!target) return;

            target.scrollIntoView({ block: "center", behavior: "smooth" });
            lastScrolledIdRef.current = activeId;
            rafRef.current = null;
        });

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [activeId]);

    return (
        <ScrollArea
            ref={scrollAreaRef}
            className="toc !w-fit !h-fit !fixed right-0 z-10 min-w-min bg-[var(--color-background)] shadow-[var(--shadow-4)] xl:min-w-0"
            scrollbars="vertical"
            type="auto"
        >
            <ul
                className="!py-0 !px-2"
                onMouseLeave={() => updateHoverTocId(null)}
            >
                {tocRoots.map(item => (
                    <TocItem key={item.id} {...item} isRoot meta={meta} />
                ))}
            </ul>
        </ScrollArea>
    );
}
