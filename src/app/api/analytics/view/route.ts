import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasPostSlug } from "@/entities/post";
import {
    type PostViewStats,
    parseTrackPostViewPayload,
    readPostViewStats,
    shouldSkipAnalyticsWrite,
    trackPostView,
} from "../lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            {
                error: "Invalid JSON body",
                ok: false,
            },
            {
                status: 400,
            },
        );
    }

    const parsed = parseTrackPostViewPayload(payload);

    if (!parsed) {
        return NextResponse.json(
            {
                error: "Missing slug",
                ok: false,
            },
            {
                status: 400,
            },
        );
    }

    if (!hasPostSlug(parsed.slug)) {
        return NextResponse.json(
            {
                error: "Post not found",
                ok: false,
            },
            {
                status: 404,
            },
        );
    }

    const tracked = !shouldSkipAnalyticsWrite(request.headers);

    let stats: PostViewStats;

    try {
        stats = tracked
            ? await trackPostView({ slug: parsed.slug })
            : await readPostViewStats(parsed.slug);
    } catch {
        stats = { totalViews: null };
    }

    const response = NextResponse.json(
        {
            enabled: stats.totalViews !== null,
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

    return response;
}
