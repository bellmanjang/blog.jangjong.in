import type { BlogVisitorStats } from "../../model/types";

export const BLOG_VISITOR_STATS_EVENT = "analytics:blog-visitor-stats";

export function dispatchBlogVisitorStats(stats: BlogVisitorStats) {
    window.dispatchEvent(
        new CustomEvent<BlogVisitorStats>(BLOG_VISITOR_STATS_EVENT, {
            detail: stats,
        }),
    );
}
