import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasPostSlug } from "@/entities/post";
import {
    CommentApiError,
    createPostComment,
    parseCreatePostCommentPayload,
    shouldSkipCommentWrite,
} from "./lib";

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

    const parsed = parseCreatePostCommentPayload(payload);

    if (!parsed) {
        return NextResponse.json(
            {
                error: "Invalid comment",
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

    if (shouldSkipCommentWrite(request.headers)) {
        return NextResponse.json(
            {
                error: "Commenting is unavailable for this request",
                ok: false,
            },
            {
                status: 403,
            },
        );
    }

    try {
        const comment = await createPostComment(parsed, request.headers);

        return NextResponse.json(
            {
                comment,
                ok: true,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        if (error instanceof CommentApiError) {
            return NextResponse.json(
                {
                    error: error.message,
                    ok: false,
                },
                {
                    status: error.status,
                },
            );
        }

        return NextResponse.json(
            {
                error: "Failed to create comment",
                ok: false,
            },
            {
                status: 500,
            },
        );
    }
}
