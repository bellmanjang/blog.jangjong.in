import type { CommentThread, PostComment } from "@/features/comments";

const BOT_USER_AGENT_RE =
    /bot|crawler|spider|slurp|bingpreview|headless|lighthouse|pagespeed|curl|wget|python-requests|go-http-client/i;
const COMMENT_AUTHOR_NAME_MAX_LENGTH = 40;
const COMMENT_CONTENT_MAX_LENGTH = 1000;
const COMMENT_RATE_LIMIT_PER_MINUTE = 3;
const COMMENT_RATE_LIMIT_PER_DAY = 30;

type HeadersLike = Pick<Headers, "get">;

export type CreatePostCommentInput = {
    slug: string;
    authorName: string;
    content: string;
    parentId: string | null;
};

type CommentRow = {
    id: string;
    post_slug: string;
    parent_id: string | null;
    author_name: string;
    content: string;
    created_at: string | Date;
};

type ParentCommentRow = {
    post_slug: string;
    parent_id: string | null;
    hidden_at: string | Date | null;
};

type CommentRateLimitRow = {
    recent_count: number | string | null;
    daily_count: number | string | null;
};

export class CommentApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
    }
}

export function isCommentsConfigured() {
    return Boolean(process.env.ANALYTICS_SALT && process.env.DATABASE_URL);
}

export function parseCreatePostCommentPayload(payload: unknown) {
    if (!payload || typeof payload !== "object") return null;

    const slug = Reflect.get(payload, "slug");
    const authorName = Reflect.get(payload, "authorName");
    const content = Reflect.get(payload, "content");
    const parentId = Reflect.get(payload, "parentId");

    if (typeof slug !== "string") return null;
    if (typeof authorName !== "string") return null;
    if (typeof content !== "string") return null;
    if (
        parentId !== undefined &&
        parentId !== null &&
        typeof parentId !== "string"
    ) {
        return null;
    }

    const trimmedSlug = slug.trim();
    const trimmedAuthorName = authorName.trim();
    const trimmedContent = content.trim();
    const trimmedParentId =
        typeof parentId === "string" ? parentId.trim() : null;

    if (!trimmedSlug) return null;
    if (
        !trimmedAuthorName ||
        trimmedAuthorName.length > COMMENT_AUTHOR_NAME_MAX_LENGTH
    ) {
        return null;
    }
    if (!trimmedContent || trimmedContent.length > COMMENT_CONTENT_MAX_LENGTH) {
        return null;
    }
    if (typeof parentId === "string" && !trimmedParentId) return null;

    return {
        slug: trimmedSlug,
        authorName: trimmedAuthorName,
        content: trimmedContent,
        parentId: trimmedParentId,
    } satisfies CreatePostCommentInput;
}

export function hasDoNotTrack(headers: HeadersLike) {
    const dnt = headers.get("dnt")?.toLowerCase();

    return dnt === "1" || dnt === "yes";
}

export function isPrefetchRequest(headers: HeadersLike) {
    return (
        headers.get("purpose") === "prefetch" ||
        headers.get("sec-purpose") === "prefetch" ||
        headers.get("next-router-prefetch") !== null ||
        headers.get("x-middleware-prefetch") === "1"
    );
}

export function isProbablyBot(userAgent: string | null) {
    if (!userAgent) return false;

    return BOT_USER_AGENT_RE.test(userAgent);
}

export function shouldSkipCommentWrite(headers: HeadersLike) {
    return (
        hasDoNotTrack(headers) ||
        isPrefetchRequest(headers) ||
        isProbablyBot(headers.get("user-agent"))
    );
}

export function getCommentRateLimitStatus({
    dailyCount,
    recentCount,
}: {
    dailyCount: number;
    recentCount: number;
}) {
    if (recentCount >= COMMENT_RATE_LIMIT_PER_MINUTE) {
        return {
            limited: true,
            retryAfterSeconds: 60,
        };
    }

    if (dailyCount >= COMMENT_RATE_LIMIT_PER_DAY) {
        return {
            limited: true,
            retryAfterSeconds: 60 * 60,
        };
    }

    return {
        limited: false,
        retryAfterSeconds: 0,
    };
}

export function validateReplyParentCandidate(
    postSlug: string,
    parent: {
        hiddenAt: string | Date | null;
        parentId: string | null;
        postSlug: string;
    } | null,
) {
    if (!parent) return "missing";
    if (parent.hiddenAt !== null) return "hidden";
    if (parent.postSlug !== postSlug) return "different-post";
    if (parent.parentId !== null) return "nested-reply";

    return "ok";
}

async function getSql() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured");
    }

    const { neon } = await import("@neondatabase/serverless");

    return neon(databaseUrl);
}

function toNumber(value: number | string | null | undefined) {
    if (typeof value === "number") return value;
    if (typeof value === "string") return Number(value);

    return 0;
}

function toIsoString(value: string | Date) {
    if (value instanceof Date) return value.toISOString();

    return new Date(value).toISOString();
}

function toPostComment(row: CommentRow): PostComment {
    return {
        id: row.id,
        postSlug: row.post_slug,
        parentId: row.parent_id,
        authorName: row.author_name,
        content: row.content,
        createdAt: toIsoString(row.created_at),
    };
}

export function buildCommentThreads(comments: PostComment[]) {
    const roots: CommentThread[] = [];
    const rootById = new Map<string, CommentThread>();

    for (const comment of comments) {
        if (comment.parentId === null) {
            const thread = {
                ...comment,
                replies: [],
            };

            roots.push(thread);
            rootById.set(comment.id, thread);
        }
    }

    for (const comment of comments) {
        if (comment.parentId === null) continue;

        const root = rootById.get(comment.parentId);

        if (root) {
            root.replies.push(comment);
        }
    }

    return roots;
}

async function hashCommentAuthor(headers: HeadersLike) {
    const salt = process.env.ANALYTICS_SALT;

    if (!salt) {
        throw new Error("ANALYTICS_SALT is not configured");
    }

    const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip =
        forwardedFor ||
        headers.get("x-real-ip") ||
        headers.get("cf-connecting-ip") ||
        "unknown";
    const userAgent = headers.get("user-agent") ?? "unknown";
    const bytes = new TextEncoder().encode(
        `${salt}:comment-author:${ip}:${userAgent}`,
    );
    const digest = await crypto.subtle.digest("SHA-256", bytes);

    return [...new Uint8Array(digest)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function assertReplyParent(
    sql: Awaited<ReturnType<typeof getSql>>,
    postSlug: string,
    parentId: string | null,
) {
    if (parentId === null) return;

    const [row] = (await sql`
        SELECT
            post_slug,
            parent_id,
            hidden_at
        FROM post_comments
        WHERE id = ${parentId}
        LIMIT 1
    `) as ParentCommentRow[];

    const status = validateReplyParentCandidate(
        postSlug,
        row
            ? {
                  hiddenAt: row.hidden_at,
                  parentId: row.parent_id,
                  postSlug: row.post_slug,
              }
            : null,
    );

    if (status !== "ok") {
        throw new CommentApiError("Invalid parent comment", 400);
    }
}

async function assertCommentRateLimit(
    sql: Awaited<ReturnType<typeof getSql>>,
    authorHash: string,
) {
    const [row] = (await sql`
        SELECT
            COUNT(*) FILTER (
                WHERE created_at >= NOW() - INTERVAL '1 minute'
            )::int AS recent_count,
            COUNT(*) FILTER (
                WHERE created_at >= NOW() - INTERVAL '1 day'
            )::int AS daily_count
        FROM post_comments
        WHERE author_hash = ${authorHash}
    `) as CommentRateLimitRow[];
    const status = getCommentRateLimitStatus({
        recentCount: toNumber(row?.recent_count),
        dailyCount: toNumber(row?.daily_count),
    });

    if (status.limited) {
        throw new CommentApiError("Too many comments", 429);
    }
}

export async function readPostCommentThreads(slug: string) {
    if (!isCommentsConfigured()) {
        return [];
    }

    const sql = await getSql();
    const rows = (await sql`
        SELECT
            id,
            post_slug,
            parent_id,
            author_name,
            content,
            created_at
        FROM post_comments
        WHERE post_slug = ${slug}
            AND hidden_at IS NULL
        ORDER BY created_at ASC, id ASC
    `) as CommentRow[];

    return buildCommentThreads(rows.map(toPostComment));
}

export async function createPostComment(
    input: CreatePostCommentInput,
    headers: HeadersLike,
) {
    if (!isCommentsConfigured()) {
        throw new CommentApiError("Comments are unavailable", 503);
    }

    const sql = await getSql();
    const authorHash = await hashCommentAuthor(headers);

    await assertCommentRateLimit(sql, authorHash);
    await assertReplyParent(sql, input.slug, input.parentId);

    const [row] = (await sql`
        INSERT INTO post_comments (
            id,
            post_slug,
            parent_id,
            author_name,
            content,
            author_hash
        )
        VALUES (
            ${crypto.randomUUID()},
            ${input.slug},
            ${input.parentId},
            ${input.authorName},
            ${input.content},
            ${authorHash}
        )
        RETURNING
            id,
            post_slug,
            parent_id,
            author_name,
            content,
            created_at
    `) as CommentRow[];

    return toPostComment(row);
}
