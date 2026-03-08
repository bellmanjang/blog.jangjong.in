import assert from "node:assert/strict";
import test from "node:test";
import type { SearchDoc } from "../model/types";
import { createSearchEngine, searchDocs } from "./search-engine";

const baseDoc: SearchDoc = {
    slug: "post-1",
    title: "검색 처리",
    summary: "한글 검색 요약",
    tags: ["search"],
    publishedAt: "2026-03-08T14:00:00+09:00",
    lastModifiedAt: "2026-03-08T14:00:00+09:00",
    highlighted: false,
    titleTokens: "검색 처리",
    summaryTokens: "한글 검색 요약",
    tagsTokens: "search",
    bodyTokens: "검색 색처 처리",
};

test("searchDocs matches Hangul bigram queries", () => {
    const miniSearch = createSearchEngine([baseDoc]);
    const { total, results } = searchDocs(miniSearch, "처리", 10);

    assert.equal(total, 1);
    assert.equal(results[0]?.slug, "post-1");
});

test("searchDocs preserves latin terms attached to Hangul particles", () => {
    const miniSearch = createSearchEngine([
        {
            ...baseDoc,
            slug: "post-2",
            title: "FSD를 적용",
            titleTokens: "fsd 를 적용",
        },
    ]);
    const { total, results } = searchDocs(miniSearch, "FSD를", 10);

    assert.equal(total, 1);
    assert.equal(results[0]?.slug, "post-2");
});

test("searchDocs respects the requested limit", () => {
    const miniSearch = createSearchEngine([
        baseDoc,
        {
            ...baseDoc,
            slug: "post-2",
            title: "검색 두번째",
        },
    ]);
    const { total, results } = searchDocs(miniSearch, "검색", 1);

    assert.equal(total, 2);
    assert.equal(results.length, 1);
});
