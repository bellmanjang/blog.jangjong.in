"use client";

import { Text } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import { BLOG_VISITOR_STATS_EVENT } from "../lib/browser";
import type { BlogVisitorStatsResponse } from "../model/types";

function fmt(value: number | null) {
    if (value === null) return "-";

    return new Intl.NumberFormat("ko-KR").format(value);
}

export function HomeVisitorStats() {
    const [stats, setStats] = useState<{
        totalVisitors: number | null;
        dailyVisitors: number | null;
    }>({ totalVisitors: null, dailyVisitors: null });
    const hasTrackedUpdateRef = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        function applyStats(next: {
            totalVisitors: number | null;
            dailyVisitors: number | null;
        }) {
            setStats(next);
        }

        function handleStatsEvent(event: Event) {
            const next = (
                event as CustomEvent<{
                    totalVisitors: number | null;
                    dailyVisitors: number | null;
                }>
            ).detail;

            hasTrackedUpdateRef.current = true;
            applyStats(next);
        }

        window.addEventListener(BLOG_VISITOR_STATS_EVENT, handleStatsEvent);

        fetch("/api/analytics/visit", {
            cache: "no-store",
            signal: controller.signal,
        })
            .then(res => (res.ok ? res.json() : null))
            .then((data: BlogVisitorStatsResponse | null) => {
                if (data?.enabled && !hasTrackedUpdateRef.current) {
                    applyStats({
                        totalVisitors: data.totalVisitors,
                        dailyVisitors: data.dailyVisitors,
                    });
                }
            })
            .catch(() => {});

        return () => {
            controller.abort();
            window.removeEventListener(
                BLOG_VISITOR_STATS_EVENT,
                handleStatsEvent,
            );
        };
    }, []);

    return (
        <div className="mt-8 flex items-center justify-center gap-2 border-t border-t-[var(--gray-5)] pt-6">
            <Text size="2" color="gray">
                지금까지 {fmt(stats.totalVisitors)}명이 방문했어요
            </Text>
            <Text size="2" color="gray" aria-hidden="true">
                ·
            </Text>
            <Text size="2" color="gray">
                오늘 {fmt(stats.dailyVisitors)}명
            </Text>
        </div>
    );
}
