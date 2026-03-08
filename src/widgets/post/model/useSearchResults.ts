import { useEffect, useRef, useState, useTransition } from "react";
import type { Post } from "@/entities/post";
import type { SearchResponse } from "@/features/search";

const SEARCH_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 200;

type SearchListItem = Pick<Post, "slug" | "publishedAt" | "title">;

type ResolvedSearchState = {
    error: string | null;
    results: SearchListItem[] | null;
    total: number;
};

function toListItems(results: SearchResponse["results"]): SearchListItem[] {
    return results.map(result => ({
        slug: result.slug,
        title: result.title,
        publishedAt: result.publishedAt,
    }));
}

async function fetchSearchResponse(query: string, signal: AbortSignal) {
    const params = new URLSearchParams({
        q: query,
        limit: String(SEARCH_LIMIT),
    });
    const response = await fetch(`/api/search?${params.toString()}`, {
        signal,
        cache: "no-store",
    });
    if (!response.ok) {
        throw new Error("Failed to load search results.");
    }

    return (await response.json()) as SearchResponse;
}

async function resolveSearchState(
    query: string,
    signal: AbortSignal,
): Promise<ResolvedSearchState> {
    try {
        const data = await fetchSearchResponse(query, signal);
        return {
            results: toListItems(data.results),
            total: data.total,
            error: null,
        };
    } catch (error) {
        if (signal.aborted) {
            throw error;
        }

        return {
            results: [],
            total: 0,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to load search results.",
        };
    }
}

function useResolvedSearchState(query: string, postCount: number) {
    const [results, setResults] = useState<SearchListItem[] | null>(null);
    const [total, setTotal] = useState(postCount);
    const [error, setError] = useState<string | null>(null);
    const [settledQuery, setSettledQuery] = useState("");
    const [isPending, startTransition] = useTransition();
    const requestIdRef = useRef(0);
    const trimmedQuery = query.trim();

    useEffect(() => {
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;

        if (!trimmedQuery) {
            startTransition(() => {
                setResults(null);
                setTotal(postCount);
                setError(null);
                setSettledQuery("");
            });
            return;
        }

        const abortController = new AbortController();

        async function syncSearch() {
            const nextState = await resolveSearchState(
                trimmedQuery,
                abortController.signal,
            );
            if (
                abortController.signal.aborted ||
                requestId !== requestIdRef.current
            ) {
                return;
            }

            startTransition(() => {
                setResults(nextState.results);
                setTotal(nextState.total);
                setError(nextState.error);
                setSettledQuery(trimmedQuery);
            });
        }

        syncSearch().catch(() => undefined);

        return () => {
            abortController.abort();
        };
    }, [postCount, trimmedQuery]);

    return {
        error,
        isPending,
        results,
        settledQuery,
        total,
    };
}

function useDebouncedQuery(query: string, delay: number) {
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedQuery(query);
        }, delay);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [delay, query]);

    return debouncedQuery;
}

export function useSearchResults(query: string, postCount: number) {
    const trimmedQuery = query.trim();
    const debouncedQuery = useDebouncedQuery(trimmedQuery, SEARCH_DEBOUNCE_MS);
    const activeQuery = trimmedQuery ? debouncedQuery : "";
    const searchState = useResolvedSearchState(activeQuery, postCount);
    const isLoading =
        trimmedQuery !== "" &&
        (trimmedQuery !== debouncedQuery ||
            searchState.settledQuery !== debouncedQuery);
    const hasSettledCurrentQuery =
        debouncedQuery !== "" &&
        trimmedQuery === debouncedQuery &&
        searchState.settledQuery === debouncedQuery;

    if (!trimmedQuery) {
        return {
            error: null,
            isLoading: false,
            isPending: searchState.isPending,
            results: null,
            total: postCount,
        };
    }

    return {
        error: hasSettledCurrentQuery ? searchState.error : null,
        isLoading,
        isPending: searchState.isPending,
        results: hasSettledCurrentQuery ? searchState.results : null,
        total: hasSettledCurrentQuery ? searchState.total : postCount,
    };
}
