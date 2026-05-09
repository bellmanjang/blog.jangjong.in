import assert from "node:assert/strict";
import test from "node:test";
import {
    buildCommentThreads,
    getCommentRateLimitStatus,
    isCommentsConfigured,
    parseCreatePostCommentPayload,
    readPostCommentThreads,
    validateReplyParentCandidate,
} from "./index";

test("parseCreatePostCommentPayload trims valid input", () => {
    assert.deepEqual(
        parseCreatePostCommentPayload({
            authorName: "  작성자  ",
            content: "  안녕하세요  ",
            parentId: "  parent-1  ",
            slug: "  post-1  ",
        }),
        {
            authorName: "작성자",
            content: "안녕하세요",
            parentId: "parent-1",
            slug: "post-1",
        },
    );
});

test("parseCreatePostCommentPayload rejects invalid input", () => {
    assert.equal(parseCreatePostCommentPayload(null), null);
    assert.equal(parseCreatePostCommentPayload({}), null);
    assert.equal(
        parseCreatePostCommentPayload({
            authorName: "",
            content: "댓글",
            slug: "post-1",
        }),
        null,
    );
    assert.equal(
        parseCreatePostCommentPayload({
            authorName: "작성자",
            content: "",
            slug: "post-1",
        }),
        null,
    );
    assert.equal(
        parseCreatePostCommentPayload({
            authorName: "a".repeat(41),
            content: "댓글",
            slug: "post-1",
        }),
        null,
    );
    assert.equal(
        parseCreatePostCommentPayload({
            authorName: "작성자",
            content: "a".repeat(1001),
            slug: "post-1",
        }),
        null,
    );
    assert.equal(
        parseCreatePostCommentPayload({
            authorName: "작성자",
            content: "댓글",
            parentId: " ",
            slug: "post-1",
        }),
        null,
    );
});

test("validateReplyParentCandidate only accepts a visible root comment in the same post", () => {
    assert.equal(validateReplyParentCandidate("post-1", null), "missing");
    assert.equal(
        validateReplyParentCandidate("post-1", {
            hiddenAt: "2026-05-09T00:00:00.000Z",
            parentId: null,
            postSlug: "post-1",
        }),
        "hidden",
    );
    assert.equal(
        validateReplyParentCandidate("post-1", {
            hiddenAt: null,
            parentId: null,
            postSlug: "post-2",
        }),
        "different-post",
    );
    assert.equal(
        validateReplyParentCandidate("post-1", {
            hiddenAt: null,
            parentId: "root-1",
            postSlug: "post-1",
        }),
        "nested-reply",
    );
    assert.equal(
        validateReplyParentCandidate("post-1", {
            hiddenAt: null,
            parentId: null,
            postSlug: "post-1",
        }),
        "ok",
    );
});

test("getCommentRateLimitStatus applies minute and daily limits", () => {
    assert.deepEqual(
        getCommentRateLimitStatus({ dailyCount: 0, recentCount: 2 }),
        {
            limited: false,
            retryAfterSeconds: 0,
        },
    );
    assert.deepEqual(
        getCommentRateLimitStatus({ dailyCount: 2, recentCount: 3 }),
        {
            limited: true,
            retryAfterSeconds: 60,
        },
    );
    assert.deepEqual(
        getCommentRateLimitStatus({ dailyCount: 30, recentCount: 0 }),
        {
            limited: true,
            retryAfterSeconds: 3600,
        },
    );
});

test("buildCommentThreads nests one-level replies under root comments", () => {
    assert.deepEqual(
        buildCommentThreads([
            {
                authorName: "A",
                content: "root",
                createdAt: "2026-05-09T00:00:00.000Z",
                id: "root-1",
                parentId: null,
                postSlug: "post-1",
            },
            {
                authorName: "B",
                content: "reply",
                createdAt: "2026-05-09T00:01:00.000Z",
                id: "reply-1",
                parentId: "root-1",
                postSlug: "post-1",
            },
        ]),
        [
            {
                authorName: "A",
                content: "root",
                createdAt: "2026-05-09T00:00:00.000Z",
                id: "root-1",
                parentId: null,
                postSlug: "post-1",
                replies: [
                    {
                        authorName: "B",
                        content: "reply",
                        createdAt: "2026-05-09T00:01:00.000Z",
                        id: "reply-1",
                        parentId: "root-1",
                        postSlug: "post-1",
                    },
                ],
            },
        ],
    );
});

test("readPostCommentThreads returns an empty list when comments storage is not configured", async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalSalt = process.env.ANALYTICS_SALT;

    delete process.env.DATABASE_URL;
    delete process.env.ANALYTICS_SALT;

    try {
        assert.equal(isCommentsConfigured(), false);
        assert.deepEqual(await readPostCommentThreads("post-1"), []);
    } finally {
        if (originalDatabaseUrl === undefined) {
            delete process.env.DATABASE_URL;
        } else {
            process.env.DATABASE_URL = originalDatabaseUrl;
        }

        if (originalSalt === undefined) {
            delete process.env.ANALYTICS_SALT;
        } else {
            process.env.ANALYTICS_SALT = originalSalt;
        }
    }
});
