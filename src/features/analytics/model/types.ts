export type BlogVisitorStats = {
    dailyVisitors: number | null;
    totalVisitors: number | null;
};

export type BlogVisitorStatsResponse = BlogVisitorStats & {
    enabled: boolean;
};

export type PostViewStats = {
    totalViews: number | null;
};

export type PostViewStatsResponse = PostViewStats & {
    enabled: boolean;
    slug: string;
};

export type TrackBlogVisitResponse = {
    enabled: boolean;
    ok: boolean;
    stats: BlogVisitorStats;
    tracked: boolean;
};

export type TrackPostViewResponse = {
    enabled: boolean;
    ok: boolean;
    stats: PostViewStats;
    tracked: boolean;
};
