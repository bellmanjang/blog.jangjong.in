import assert from "node:assert/strict";
import test from "node:test";
import type { Post } from "../model/types";
import { buildPostJsonLd, buildPostMetadataUrls } from "./metadata";

const basePost: Post = {
    slug: "Next.js에 FSD 적용",
    title: "Next.js에 FSD 적용해보기",
    summary: "메타데이터 생성 테스트",
    tags: ["nextjs", "fsd"],
    publishedAt: "2026-03-08T14:00:00+09:00",
    lastModifiedAt: "2026-03-09T10:30:00+09:00",
    content: "본문",
    highlighted: true,
};

test("buildPostMetadataUrls percent-encodes slugs for page and og paths", () => {
    assert.deepEqual(
        buildPostMetadataUrls("https://blog.jangjong.in", basePost.slug),
        {
            postUrl:
                "https://blog.jangjong.in/posts/Next.js%EC%97%90%20FSD%20%EC%A0%81%EC%9A%A9",
            ogImageUrl:
                "https://blog.jangjong.in/og/posts/Next.js%EC%97%90%20FSD%20%EC%A0%81%EC%9A%A9",
        },
    );
});

test("buildPostJsonLd serializes iso timestamps and canonical urls", () => {
    const jsonLd = JSON.parse(
        buildPostJsonLd(basePost, "https://blog.jangjong.in"),
    ) as Record<string, unknown>;

    assert.equal(jsonLd["@context"], "https://schema.org");
    assert.equal(jsonLd["@type"], "BlogPosting");
    assert.equal(jsonLd.headline, basePost.title);
    assert.equal(jsonLd.description, basePost.summary);
    assert.equal(jsonLd.datePublished, "2026-03-08T05:00:00.000Z");
    assert.equal(jsonLd.dateModified, "2026-03-09T01:30:00.000Z");
    assert.equal(
        jsonLd.image,
        "https://blog.jangjong.in/og/posts/Next.js%EC%97%90%20FSD%20%EC%A0%81%EC%9A%A9",
    );
    assert.equal(
        jsonLd.url,
        "https://blog.jangjong.in/posts/Next.js%EC%97%90%20FSD%20%EC%A0%81%EC%9A%A9",
    );
    assert.deepEqual(jsonLd.author, {
        "@type": "Person",
        name: "Jang Jong-in",
        alternateName: "장종인",
        url: "https://jangjong.in",
    });
});
