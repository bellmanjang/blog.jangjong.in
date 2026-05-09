import { NextResponse } from "next/server";
import { hasPostSlug } from "@/entities/post";
import { safeDecodeURIComponent } from "@/shared/lib";
import { isCommentsConfigured, readPostCommentThreads } from "../../lib";

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

    if (!isCommentsConfigured()) {
        return NextResponse.json(
            {
                comments: [],
                enabled: false,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    }

    try {
        const comments = await readPostCommentThreads(slug);

        return NextResponse.json(
            {
                comments,
                enabled: true,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch {
        return NextResponse.json(
            {
                comments: [],
                enabled: false,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    }
}
