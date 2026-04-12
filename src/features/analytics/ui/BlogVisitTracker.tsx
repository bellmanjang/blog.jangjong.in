"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { dispatchBlogVisitorStats } from "../lib/browser";
import type { TrackBlogVisitResponse } from "../model/types";

const ANALYTICS_DWELL_TIME_MS = 1000;

export function BlogVisitTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) return;

        const sessionKey = `blog-visit:${pathname}`;
        const trackedPath = sessionStorage.getItem(sessionKey);

        if (trackedPath === "1") return;

        let timeoutId: number | null = null;
        const controller = new AbortController();

        async function track() {
            if (document.visibilityState !== "visible") return;

            try {
                const response = await fetch("/api/analytics/visit", {
                    cache: "no-store",
                    credentials: "same-origin",
                    headers: {
                        "content-type": "application/json",
                    },
                    keepalive: true,
                    method: "POST",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const payload =
                    (await response.json()) as TrackBlogVisitResponse;

                if (payload.enabled) {
                    dispatchBlogVisitorStats(payload.stats);
                }

                sessionStorage.setItem(sessionKey, "1");
            } catch {}
        }

        function queueTrack() {
            if (timeoutId !== null) return;

            timeoutId = window.setTimeout(() => {
                timeoutId = null;
                void track();
            }, ANALYTICS_DWELL_TIME_MS);
        }

        function handleVisibilityChange() {
            if (document.visibilityState !== "visible") return;

            queueTrack();
        }

        if (document.visibilityState === "visible") {
            queueTrack();
        }

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            controller.abort();

            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [pathname]);

    return null;
}
