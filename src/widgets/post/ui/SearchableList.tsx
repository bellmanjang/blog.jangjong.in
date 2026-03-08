"use client";

import { Box, Spinner, Text, TextField } from "@radix-ui/themes";
import { Search } from "lucide-react";
import { useState } from "react";
import { cx } from "@/shared/lib";
import { useSearchResults } from "../model/useSearchResults";
import { List, type PostListItem } from "./List";
import styles from "./SearchableList.module.scss";

function SearchStatus({
    error,
    hasQuery,
    isLoading,
    isPending,
    total,
}: {
    error: string | null;
    hasQuery: boolean;
    isLoading: boolean;
    isPending: boolean;
    total: number;
}) {
    return (
        <Box className="mb-4 h-6 px-1">
            <Text className="text-[var(--gray-10)] text-sm" size="1">
                {error ??
                    (hasQuery
                        ? isLoading
                            ? "Searching..."
                            : `${total} result${total === 1 ? "" : "s"}${isPending ? "..." : ""}`
                        : null)}
            </Text>
        </Box>
    );
}

function SearchBar({
    hideOverlay,
    isLoading,
    showOverlay,
    query,
    setQuery,
}: {
    hideOverlay: () => void;
    isLoading: boolean;
    showOverlay: () => void;
    query: string;
    setQuery: (next: string) => void;
}) {
    return (
        <div
            className="w-full border border-[var(--gray-a6)]"
            onBlurCapture={event => {
                const nextTarget = event.relatedTarget;
                if (
                    nextTarget instanceof Node &&
                    event.currentTarget.contains(nextTarget)
                ) {
                    return;
                }

                hideOverlay();
            }}
            onFocusCapture={showOverlay}
            onPointerDownCapture={showOverlay}
        >
            <TextField.Root
                className="!shadow-none"
                onChange={event => {
                    showOverlay();
                    setQuery(event.currentTarget.value);
                }}
                onKeyDownCapture={event => {
                    if (
                        event.key === "Escape" &&
                        event.target instanceof HTMLInputElement
                    ) {
                        event.preventDefault();
                        hideOverlay();
                    }
                }}
                placeholder="Search posts"
                size="2"
                value={query}
            >
                <TextField.Slot className="!m-0 !p-0 flex aspect-square h-full shrink-0 items-center justify-center">
                    {isLoading ? (
                        <Spinner className="h-4 w-4" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                </TextField.Slot>
            </TextField.Root>
        </div>
    );
}

function useSearchInput() {
    const [query, setQuery] = useState("");

    return { query, setQuery };
}

export function SearchableList({ posts }: { posts: PostListItem[] }) {
    const input = useSearchInput();
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const search = useSearchResults(input.query, posts.length);
    const hasQuery = input.query.trim().length > 0;
    const isShowingSearchResults = hasQuery && search.results !== null;
    const visiblePosts = hasQuery ? (search.results ?? []) : posts;
    const showEmptyResults =
        hasQuery &&
        search.results !== null &&
        !search.isLoading &&
        !search.error &&
        visiblePosts.length === 0;

    return (
        <div className="relative">
            <div className="relative z-[2001]">
                <SearchBar
                    hideOverlay={() => setIsOverlayVisible(false)}
                    isLoading={search.isLoading}
                    query={input.query}
                    setQuery={input.setQuery}
                    showOverlay={() => setIsOverlayVisible(true)}
                />

                <SearchStatus
                    error={search.error}
                    hasQuery={hasQuery}
                    isLoading={search.isLoading}
                    isPending={search.isPending}
                    total={search.total}
                />
            </div>

            <div
                aria-hidden="true"
                className={cx(
                    styles.list_overlay,
                    "fixed inset-0 z-[2000]",
                    isOverlayVisible
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0",
                )}
                onClick={() => {
                    setIsOverlayVisible(false);
                    if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                }}
                onPointerDown={event => {
                    event.preventDefault();
                }}
            />

            {visiblePosts.length > 0 ? (
                <List
                    posts={visiblePosts}
                    variant={isShowingSearchResults ? "search" : "archive"}
                />
            ) : showEmptyResults ? (
                <Text>No posts found.</Text>
            ) : null}
        </div>
    );
}
