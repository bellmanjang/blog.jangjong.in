"use client";

import { ScrollArea } from "@radix-ui/themes";
import { useEffect, useMemo, useRef } from "react";
import { cx } from "@/shared/lib";
import type { HeadingNode } from "@/shared/markdown";
import { useSectionObserver } from "../hooks/useSectionObserver";
import { useTocAutoScroll } from "../hooks/useTocAutoScroll";
import { useTocHover } from "../hooks/useTocHover";
import { buildTocLineMeta, flattenTocIds } from "../lib/toc";
import { useTocStore } from "../store/toc-store";
import styles from "./Toc.module.scss";
import { TocItem } from "./TocItem";

export function TocRoot({ tocRoots }: { tocRoots: HeadingNode[] }) {
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
            className={cx(
                styles.toc,
                "!w-fit !h-auto !fixed right-0 z-10 min-w-min bg-[var(--color-background)] py-1 shadow-[var(--shadow-4)] xl:min-w-0",
            )}
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
