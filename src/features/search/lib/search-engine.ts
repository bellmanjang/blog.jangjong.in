import type { SearchResult } from "minisearch";
import MiniSearch from "minisearch";
import type { SearchDoc, SearchHit } from "../model/types";
import { koBigramTokens, normalizeText } from "./ko-ngram";

const SEARCH_FIELDS = [
    "titleTokens",
    "summaryTokens",
    "tagsTokens",
    "bodyTokens",
] as const satisfies readonly (keyof SearchDoc)[];

const STORE_FIELDS = [
    "slug",
    "title",
    "summary",
    "tags",
    "publishedAt",
    "lastModifiedAt",
    "highlighted",
] as const satisfies readonly (keyof SearchDoc)[];

function toSearchHit(result: SearchResult): SearchHit {
    return {
        slug: result.slug,
        title: result.title,
        summary: result.summary,
        tags: result.tags,
        publishedAt: result.publishedAt,
        lastModifiedAt: result.lastModifiedAt,
        highlighted: result.highlighted,
        score: result.score,
        terms: result.terms,
        queryTerms: result.queryTerms,
        match: result.match,
    };
}

export function createSearchEngine(docs: SearchDoc[]) {
    const miniSearch = new MiniSearch<SearchDoc>({
        idField: "slug",
        fields: [...SEARCH_FIELDS],
        storeFields: [...STORE_FIELDS],
        searchOptions: {
            boost: {
                titleTokens: 4,
                tagsTokens: 3,
                summaryTokens: 2,
                bodyTokens: 1,
            },
        },
    });

    miniSearch.addAll(docs);

    return miniSearch;
}

export function searchDocs(
    miniSearch: MiniSearch<SearchDoc>,
    query: string,
    limit: number,
) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return { total: 0, results: [] as SearchHit[] };

    const searchQuery = koBigramTokens(normalizedQuery);
    if (!searchQuery) return { total: 0, results: [] as SearchHit[] };

    const rawResults = miniSearch.search(searchQuery);

    return {
        total: rawResults.length,
        results: rawResults.slice(0, limit).map(toSearchHit),
    };
}
