"use client";

import { useEffect } from "react";
import { scrollToHeadingsAnchor } from "@/app/_components/markdown/anchor";

export function useHashScroll() {
    useEffect(() => {
        const run = () => {
            const id = decodeURIComponent(
                window.location.hash.replace("#", ""),
            );
            if (!id) return;

            requestAnimationFrame(() => scrollToHeadingsAnchor(id));
        };

        const origPushState = history.pushState;
        const origReplaceState = history.replaceState;

        const notify = () => {
            // hash만 바뀌는 경우에도 run 되게
            window.dispatchEvent(new Event("hashchange"));
        };

        history.pushState = function (...args) {
            origPushState.apply(this, args);
            notify();
        };

        history.replaceState = function (...args) {
            origReplaceState.apply(this, args);
            notify();
        };

        // 초기 + 이벤트 구독
        run();
        window.addEventListener("hashchange", run);
        window.addEventListener("popstate", run);

        return () => {
            history.pushState = origPushState;
            history.replaceState = origReplaceState;

            window.removeEventListener("hashchange", run);
            window.removeEventListener("popstate", run);
        };
    }, []);
}
