"use client";

import { Text } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type {
    PostViewStatsResponse,
    TrackPostViewResponse,
} from "../model/types";

const ANALYTICS_DWELL_TIME_MS = 1000;

function formatViewCount(value: number | null) {
    if (value === null) return "-";

    return new Intl.NumberFormat("ko-KR").format(value);
}

export function PostViewCounter({ slug }: { slug: string }) {
    const pathname = usePathname();
    const [totalViews, setTotalViews] = useState<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadInitialCount() {
            try {
                const response = await fetch(
                    `/api/analytics/posts/${encodeURIComponent(slug)}`,
                    {
                        cache: "no-store",
                        signal: controller.signal,
                    },
                );

                if (!response.ok) return;

                const payload =
                    (await response.json()) as PostViewStatsResponse;

                setTotalViews(payload.totalViews);
            } catch {}
        }

        void loadInitialCount();

        return () => controller.abort();
    }, [slug]);

    useEffect(() => {
        if (!pathname) return;

        const sessionKey = `post-view:${slug}:${pathname}`;
        const trackedPath = sessionStorage.getItem(sessionKey);

        if (trackedPath === "1") return;

        let timeoutId: number | null = null;
        const controller = new AbortController();

        async function track() {
            if (document.visibilityState !== "visible") return;

            try {
                const response = await fetch("/api/analytics/view", {
                    body: JSON.stringify({ slug }),
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
                    (await response.json()) as TrackPostViewResponse;

                sessionStorage.setItem(sessionKey, "1");
                setTotalViews(payload.stats.totalViews);
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
    }, [pathname, slug]);

    return (
        <Text size="2" color="gray">
            조회수 {formatViewCount(totalViews)}
        </Text>
    );
}
