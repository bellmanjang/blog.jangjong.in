import type { SearchHit, SearchResponse } from "@/features/search";

export const DEFAULT_SEARCH_LIMIT = 10;
export const MAX_SEARCH_LIMIT = 20;

type BuildSearchResponseOptions = {
    query: string;
    total: number;
    limit: number;
    results: SearchHit[];
};

export function parseSearchLimit(rawLimit: string | null) {
    if (rawLimit == null) return DEFAULT_SEARCH_LIMIT;

    const limit = Number.parseInt(rawLimit, 10);
    if (!Number.isFinite(limit) || limit < 1) return DEFAULT_SEARCH_LIMIT;

    return Math.min(limit, MAX_SEARCH_LIMIT);
}

export function buildSearchResponse({
    query,
    total,
    limit,
    results,
}: BuildSearchResponseOptions): SearchResponse {
    return {
        query,
        total,
        limit,
        results,
    };
}

export function buildEmptySearchResponse(
    query: string,
    limit: number,
): SearchResponse {
    return buildSearchResponse({
        query,
        total: 0,
        limit,
        results: [],
    });
}
