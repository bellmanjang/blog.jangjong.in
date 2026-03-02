"use client";

import { useEffect, useRef } from "react";
import { useTocStore } from "@/app/_features/posts/store/toc-store";

export const ClickTocIdResetter = () => {
    const ref = useRef<HTMLDivElement>(null);

    const updateClickTocId = useTocStore(state => state.updateClickTocId);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const viewport = document.getElementById("app-scrollarea");
        if (!viewport) return;

        const reset = () => updateClickTocId(null);

        viewport.addEventListener("wheel", reset, { passive: true });
        viewport.addEventListener("touchmove", reset, { passive: true });

        const onKeyDown = (e: KeyboardEvent) => {
            const keys = [
                "ArrowUp",
                "ArrowDown",
                "PageUp",
                "PageDown",
                "Home",
                "End",
                " ",
            ];
            if (keys.includes(e.key)) reset();
        };
        window.addEventListener("keydown", onKeyDown);

        return () => {
            viewport.removeEventListener("wheel", reset);
            viewport.removeEventListener("touchmove", reset);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [updateClickTocId]);

    return <div ref={ref} className="absolute top-0 left-0 hidden h-0 w-0" />;
};
