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

CREATE TABLE IF NOT EXISTS post_comments (
    id TEXT PRIMARY KEY,
    post_slug TEXT NOT NULL,
    parent_id TEXT NULL REFERENCES post_comments(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    author_hash TEXT NOT NULL,
    hidden_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_created_at
    ON post_comments (post_slug, created_at);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_parent_created_at
    ON post_comments (post_slug, parent_id, created_at);

CREATE INDEX IF NOT EXISTS idx_post_comments_author_created_at
    ON post_comments (author_hash, created_at);
