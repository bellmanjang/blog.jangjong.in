import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
    ANALYTICS_VISITOR_COOKIE,
    type BlogVisitorStats,
    buildVisitorCookieOptions,
    createVisitorId,
    readBlogVisitorStats,
    shouldSkipAnalyticsWrite,
    trackBlogVisit,
} from "../lib";

export async function GET() {
    let stats: BlogVisitorStats;

    try {
        stats = await readBlogVisitorStats();
    } catch {
        stats = { totalVisitors: null, dailyVisitors: null };
    }

    return NextResponse.json(
        {
            enabled: stats.totalVisitors !== null,
            ...stats,
        },
        {
            headers: { "Cache-Control": "no-store" },
        },
    );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const existingVisitorId =
        request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value ?? null;
    const visitorId = existingVisitorId ?? createVisitorId();
    const tracked = !shouldSkipAnalyticsWrite(request.headers);

    let stats: BlogVisitorStats;

    try {
        stats = tracked
            ? await trackBlogVisit(visitorId)
            : await readBlogVisitorStats();
    } catch {
        stats = { totalVisitors: null, dailyVisitors: null };
    }

    const response = NextResponse.json(
        {
            enabled: stats.totalVisitors !== null,
            ok: true,
            stats,
            tracked,
        },
        {
            headers: {
                "Cache-Control": "no-store",
            },
        },
    );

    if (!existingVisitorId) {
        response.cookies.set(
            ANALYTICS_VISITOR_COOKIE,
            visitorId,
            buildVisitorCookieOptions(),
        );
    }

    return response;
}
