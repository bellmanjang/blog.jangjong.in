import { NextResponse } from "next/server";
import { hasPostSlug } from "@/entities/post";
import { safeDecodeURIComponent } from "@/shared/lib";
import { type PostViewStats, readPostViewStats } from "../../lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
    params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: Params) {
    const { slug: rawSlug } = await context.params;
    const slug = safeDecodeURIComponent(rawSlug);

    if (!hasPostSlug(slug)) {
        return NextResponse.json(
            {
                error: "Post not found",
            },
            {
                status: 404,
            },
        );
    }

    let stats: PostViewStats;

    try {
        stats = await readPostViewStats(slug);
    } catch {
        stats = { totalViews: null };
    }

    return NextResponse.json(
        {
            enabled: stats.totalViews !== null,
            slug,
            totalViews: stats.totalViews,
        },
        {
            headers: {
                "Cache-Control": "no-store",
            },
        },
    );
}
