const ANALYTICS_TIME_ZONE = "Asia/Seoul";
const BOT_USER_AGENT_RE =
    /bot|crawler|spider|slurp|bingpreview|headless|lighthouse|pagespeed|curl|wget|python-requests|go-http-client/i;

export const ANALYTICS_VISITOR_COOKIE = "visitor_id";

type HeadersLike = Pick<Headers, "get">;

export type BlogVisitorStats = {
    dailyVisitors: number | null;
    totalVisitors: number | null;
};

type BlogVisitorStatsRow = {
    daily_visitors: number | string | null;
    total_visitors: number | string | null;
};

export type PostViewStats = {
    totalViews: number | null;
};

type PostViewStatsRow = {
    total_views: number | string | null;
};

type TrackPostViewInput = {
    slug: string;
};

export function analyticsDisabledBlogVisitorStats(): BlogVisitorStats {
    return {
        dailyVisitors: null,
        totalVisitors: null,
    };
}

export function analyticsDisabledPostViewStats(): PostViewStats {
    return {
        totalViews: null,
    };
}

export function isAnalyticsConfigured() {
    return Boolean(process.env.ANALYTICS_SALT && process.env.DATABASE_URL);
}

export function isAnalyticsWriteEnabled() {
    if (!isAnalyticsConfigured()) return false;
    if (process.env.VERCEL_ENV === "preview") return false;
    if (process.env.NODE_ENV === "production") return true;

    return process.env.ANALYTICS_WRITE_IN_DEV === "1";
}

export function createVisitorId() {
    return crypto.randomUUID();
}

export function buildVisitorCookieOptions() {
    return {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
    };
}

export function parseTrackPostViewPayload(payload: unknown) {
    if (!payload || typeof payload !== "object") return null;

    const slug = Reflect.get(payload, "slug");

    if (typeof slug !== "string") return null;

    const trimmedSlug = slug.trim();

    if (!trimmedSlug) return null;

    return {
        slug: trimmedSlug,
    };
}

export function getKstDateString(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: ANALYTICS_TIME_ZONE,
        year: "numeric",
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts
            .filter(part => part.type !== "literal")
            .map(part => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
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

export function shouldSkipAnalyticsWrite(headers: HeadersLike) {
    return (
        !isAnalyticsWriteEnabled() ||
        hasDoNotTrack(headers) ||
        isPrefetchRequest(headers) ||
        isProbablyBot(headers.get("user-agent"))
    );
}

async function hashAnalyticsValue(value: string) {
    const salt = process.env.ANALYTICS_SALT;

    if (!salt) {
        throw new Error("ANALYTICS_SALT is not configured");
    }

    const bytes = new TextEncoder().encode(`${salt}:${value}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);

    return [...new Uint8Array(digest)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
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

async function queryPostViewStats(slug: string) {
    const sql = await getSql();
    const [row] = (await sql`
        SELECT
            COALESCE(
                (SELECT total_views::int FROM post_total_views WHERE slug = ${slug}),
                0
            ) AS total_views
    `) as PostViewStatsRow[];

    return {
        totalViews: toNumber(row?.total_views),
    } satisfies PostViewStats;
}

export async function readPostViewStats(slug: string) {
    if (!isAnalyticsConfigured()) {
        return analyticsDisabledPostViewStats();
    }

    return queryPostViewStats(slug);
}

export async function readBlogVisitorStats() {
    if (!isAnalyticsConfigured()) {
        return analyticsDisabledBlogVisitorStats();
    }

    const sql = await getSql();
    const dateKr = getKstDateString();
    const [row] = (await sql`
        SELECT
            COALESCE(
                (SELECT COUNT(*)::int FROM blog_visitors),
                0
            ) AS total_visitors,
            COALESCE(
                (
                    SELECT COUNT(*)::int
                    FROM blog_daily_visitors
                    WHERE date_kr = ${dateKr}
                ),
                0
            ) AS daily_visitors
    `) as BlogVisitorStatsRow[];

    return {
        dailyVisitors: toNumber(row?.daily_visitors),
        totalVisitors: toNumber(row?.total_visitors),
    } satisfies BlogVisitorStats;
}

export async function trackBlogVisit(visitorId: string) {
    if (!isAnalyticsConfigured()) {
        return analyticsDisabledBlogVisitorStats();
    }

    const sql = await getSql();
    const dateKr = getKstDateString();
    const visitorHash = await hashAnalyticsValue(visitorId);
    const [row] = (await sql`
        WITH inserted_total AS (
            INSERT INTO blog_visitors (
                visitor_hash,
                first_visited_at
            )
            VALUES (
                ${visitorHash},
                NOW()
            )
            ON CONFLICT DO NOTHING
        ),
        inserted_daily AS (
            INSERT INTO blog_daily_visitors (
                date_kr,
                visitor_hash,
                first_visited_at
            )
            VALUES (
                ${dateKr},
                ${visitorHash},
                NOW()
            )
            ON CONFLICT DO NOTHING
        )
        SELECT
            COALESCE(
                (SELECT COUNT(*)::int FROM blog_visitors),
                0
            ) AS total_visitors,
            COALESCE(
                (
                    SELECT COUNT(*)::int
                    FROM blog_daily_visitors
                    WHERE date_kr = ${dateKr}
                ),
                0
            ) AS daily_visitors
    `) as BlogVisitorStatsRow[];

    return {
        dailyVisitors: toNumber(row?.daily_visitors),
        totalVisitors: toNumber(row?.total_visitors),
    } satisfies BlogVisitorStats;
}

export async function trackPostView({ slug }: TrackPostViewInput) {
    if (!isAnalyticsConfigured()) {
        return analyticsDisabledPostViewStats();
    }

    const sql = await getSql();
    const [row] = (await sql`
        INSERT INTO post_total_views (
            slug,
            total_views,
            last_viewed_at
        )
        VALUES (
            ${slug},
            1,
            NOW()
        )
        ON CONFLICT (slug)
        DO UPDATE SET
            total_views = post_total_views.total_views + 1,
            last_viewed_at = NOW()
        RETURNING total_views::int AS total_views
    `) as PostViewStatsRow[];

    return {
        totalViews: toNumber(row?.total_views),
    } satisfies PostViewStats;
}
