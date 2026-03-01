import { useCallback, useEffect, useRef } from "react";
import { useTocStore } from "@/app/_features/posts/store/toc-store";

function getTocIdFromEventTarget(target: EventTarget | null): string | null {
    const el = target as HTMLElement | null;
    if (!el) return null;

    const hit = el.closest("a[data-toc-id]") as HTMLElement | null;
    return hit?.dataset.tocId ?? null;
}

export const useTocHover = () => {
    const pendingHoverIdRef = useRef<string | null>(null);
    const lastCommittedRef = useRef<string | null>(null);
    const hoverRafRef = useRef<number | null>(null);

    const updateHoverTocId = useTocStore(state => state.updateHoverTocId);

    const commit = useCallback(() => {
        hoverRafRef.current = null;
        const next = pendingHoverIdRef.current;
        if (next === lastCommittedRef.current) return;
        lastCommittedRef.current = next;
        updateHoverTocId(next);
    }, [updateHoverTocId]);

    const onMove = useCallback(
        (e: React.PointerEvent) => {
            pendingHoverIdRef.current = getTocIdFromEventTarget(e.target);
            if (hoverRafRef.current != null) return;
            hoverRafRef.current = requestAnimationFrame(commit);
        },
        [commit],
    );

    const onLeave = useCallback(() => {
        pendingHoverIdRef.current = null;
        if (hoverRafRef.current != null) return;
        hoverRafRef.current = requestAnimationFrame(commit);
    }, [commit]);

    useEffect(() => {
        return () => {
            if (hoverRafRef.current != null) {
                cancelAnimationFrame(hoverRafRef.current);
            }
            hoverRafRef.current = null;
        };
    }, []);

    return { onMove, onLeave };
};
