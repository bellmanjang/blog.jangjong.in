import assert from "node:assert/strict";
import test from "node:test";
import type { SearchHit } from "@/features/search";
import {
    buildEmptySearchResponse,
    buildSearchResponse,
    parseSearchLimit,
} from "./response";

const baseHit: SearchHit = {
    slug: "post-1",
    title: "검색 처리",
    summary: "검색 결과 요약",
    tags: ["search"],
    publishedAt: "2026-03-08T14:00:00+09:00",
    lastModifiedAt: "2026-03-08T14:00:00+09:00",
    highlighted: false,
    score: 1.25,
    terms: ["검색"],
    queryTerms: ["검색"],
    match: {
        titleTokens: ["검색"],
    },
};

test("parseSearchLimit falls back for empty or invalid values", () => {
    assert.equal(parseSearchLimit(null), 10);
    assert.equal(parseSearchLimit("0"), 10);
    assert.equal(parseSearchLimit("NaN"), 10);
});

test("parseSearchLimit clamps to the configured maximum", () => {
    assert.equal(parseSearchLimit("5"), 5);
    assert.equal(parseSearchLimit("50"), 20);
});

test("buildEmptySearchResponse returns a serializable empty payload", () => {
    assert.deepEqual(buildEmptySearchResponse("검색", 7), {
        query: "검색",
        total: 0,
        limit: 7,
        results: [],
    });
});

test("buildSearchResponse preserves result payloads", () => {
    assert.deepEqual(
        buildSearchResponse({
            query: "검색",
            total: 1,
            limit: 3,
            results: [baseHit],
        }),
        {
            query: "검색",
            total: 1,
            limit: 3,
            results: [baseHit],
        },
    );
});
