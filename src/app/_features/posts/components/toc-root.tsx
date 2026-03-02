"use client";

import { ScrollArea } from "@radix-ui/themes";
import { useEffect, useMemo, useRef } from "react";
import type { TocNode } from "@/app/_components/markdown/rehype-collect-toc";
import { TocItem } from "@/app/_features/posts/components/toc-item";
import { useSectionObserver } from "@/app/_features/posts/hooks/useSectionObserver";
import { useTocAutoScroll } from "@/app/_features/posts/hooks/useTocAutoScroll";
import { useTocHover } from "@/app/_features/posts/hooks/useTocHover";
import { useTocStore } from "@/app/_features/posts/store/toc-store";
import {
    buildTocLineMeta,
    flattenTocIds,
} from "@/app/_features/posts/util/toc-util";

export function TocRoot({ tocRoots }: { tocRoots: TocNode[] }) {
    const listRef = useRef<HTMLUListElement | null>(null);
    const tocOrderIds = useMemo(() => flattenTocIds(tocRoots), [tocRoots]);

    const headingsInView = useTocStore(state => state.headingsInView);
    const hoverTocId = useTocStore(state => state.hoverTocId);
    const clear = useTocStore(state => state.clear);
    const initializeFeedObserver = useTocStore(
        state => state.initializeFeedObserver,
    );

    useEffect(() => {
        const viewport = document.getElementById("app-scrollarea");

        initializeFeedObserver(viewport);

        return () => clear();
    }, [initializeFeedObserver, clear]);

    useSectionObserver({ tocOrderIds });

    const { onMove, onLeave } = useTocHover();

    useTocAutoScroll({ rootRef: listRef, tocOrderIds });

    const meta = useMemo(
        () => buildTocLineMeta(tocRoots, headingsInView, hoverTocId),
        [tocRoots, headingsInView, hoverTocId],
    );

    return (
        <ScrollArea
            className="toc !w-fit !h-auto !fixed right-0 z-10 min-w-min bg-[var(--color-background)] py-1 shadow-[var(--shadow-4)] xl:min-w-0"
            scrollbars="vertical"
            type="auto"
        >
            <ul
                ref={listRef}
                className="!py-0 !px-1"
                onPointerMove={onMove}
                onPointerLeave={onLeave}
                onPointerDown={onMove}
                onPointerCancel={onLeave}
            >
                {tocRoots.map(item => (
                    <TocItem key={item.id} {...item} isRoot meta={meta} />
                ))}
            </ul>
        </ScrollArea>
    );
}
