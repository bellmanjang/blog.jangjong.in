CREATE TABLE IF NOT EXISTS blog_visitors (
    visitor_hash TEXT PRIMARY KEY,
    first_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_daily_visitors (
    date_kr DATE NOT NULL,
    visitor_hash TEXT NOT NULL,
    first_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date_kr, visitor_hash)
);

CREATE TABLE IF NOT EXISTS post_total_views (
    slug TEXT NOT NULL,
    total_views INTEGER NOT NULL DEFAULT 0,
    last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (slug)
);
