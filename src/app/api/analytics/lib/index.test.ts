import assert from "node:assert/strict";
import test from "node:test";
import {
    getKstDateString,
    hasDoNotTrack,
    isPrefetchRequest,
    isProbablyBot,
    parseTrackPostViewPayload,
} from "./index";

function createHeaders(values: Record<string, string>) {
    return new Headers(values);
}

test("parseTrackPostViewPayload accepts a non-empty slug", () => {
    assert.deepEqual(parseTrackPostViewPayload({ slug: "post-1" }), {
        slug: "post-1",
    });
});

test("parseTrackPostViewPayload rejects empty and invalid payloads", () => {
    assert.equal(parseTrackPostViewPayload(null), null);
    assert.equal(parseTrackPostViewPayload({}), null);
    assert.equal(parseTrackPostViewPayload({ slug: "   " }), null);
});

test("getKstDateString formats the calendar day in Asia/Seoul", () => {
    assert.equal(
        getKstDateString(new Date("2026-03-18T23:30:00.000Z")),
        "2026-03-19",
    );
});

test("tracking guards detect bots, prefetches, and do-not-track requests", () => {
    assert.equal(
        isProbablyBot("Mozilla/5.0 (compatible; Googlebot/2.1)"),
        true,
    );
    assert.equal(isProbablyBot("Mozilla/5.0 AppleWebKit/537.36"), false);
    assert.equal(hasDoNotTrack(createHeaders({ dnt: "1" })), true);
    assert.equal(
        isPrefetchRequest(createHeaders({ "next-router-prefetch": "1" })),
        true,
    );
});
