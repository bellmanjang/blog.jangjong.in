"use client";

import { ScrollArea } from "@radix-ui/themes";
import { useEffect, useMemo, useRef } from "react";
import type { TocNode } from "@/app/_components/markdown/rehype-collect-toc";
import { TocItem } from "@/app/_features/posts/components/toc-item";
import { useTocAutoScroll } from "@/app/_features/posts/hooks/useTocAutoScroll";
import { useTocHover } from "@/app/_features/posts/hooks/useTocHover";
import { useTocStore } from "@/app/_features/posts/store/toc-store";
import { buildTocLineMeta } from "@/app/_features/posts/util/toc-util";

export function TocRoot({ tocRoots }: { tocRoots: TocNode[] }) {
    const listRef = useRef<HTMLUListElement | null>(null);

    const headingsInView = useTocStore(state => state.headingsInView);
    const hoverTocId = useTocStore(state => state.hoverTocId);
    const clear = useTocStore(state => state.clear);
    const initializeFeedObserver = useTocStore(
        state => state.initializeFeedObserver,
    );

    useEffect(() => {
        initializeFeedObserver();

        return () => clear();
    }, [initializeFeedObserver, clear]);

    const { onMove, onLeave } = useTocHover();

    useTocAutoScroll({ rootRef: listRef, tocRoots });

    const meta = useMemo(
        () => buildTocLineMeta(tocRoots, headingsInView, hoverTocId),
        [tocRoots, headingsInView, hoverTocId],
    );

    return (
        <ScrollArea
            className="toc !w-fit !h-fit !fixed right-0 z-10 min-w-min bg-[var(--color-background)] shadow-[var(--shadow-4)] xl:min-w-0"
            scrollbars="vertical"
            type="auto"
        >
            <ul
                ref={listRef}
                className="!py-0 !px-2"
                onPointerMove={onMove}
                onPointerLeave={onLeave}
                onPointerCancel={onLeave}
            >
                {tocRoots.map(item => (
                    <TocItem key={item.id} {...item} isRoot meta={meta} />
                ))}
            </ul>
        </ScrollArea>
    );
}
