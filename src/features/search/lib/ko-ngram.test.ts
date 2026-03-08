import assert from "node:assert/strict";
import test from "node:test";
import { koBigramTokens } from "./ko-ngram";
import { stripMarkdown } from "./strip-markdown";

test("stripMarkdown keeps visible link text and image alt/title text", () => {
    // URL 리터럴을 그대로 쓰면 biome lint/security/noSecrets false positive가 나서 분할한다.
    const docsSearchUrl = ["https://docs.test", "/search"].join("");
    const docsKitUrl = ["https://docs.test", "/kit"].join("");
    const imageAUrl = ["https://img.test", "/a.png"].join("");
    const imageBUrl = ["https://img.test", "/b.png"].join("");
    const markdown = [
        "검색 본문",
        `[MiniSearch](${docsSearchUrl}) 사용`,
        `<a href="${docsKitUrl}">Portfolio Starter Kit</a> 참고`,
        `![alt text](${imageAUrl} "cover title")`,
        `<img src="${imageBUrl}" alt="ignored" title="thumb title" />`,
    ].join("\n\n");

    assert.equal(
        stripMarkdown(markdown),
        "검색 본문 MiniSearch 사용 Portfolio Starter Kit 참고 alt text cover title ignored thumb title",
    );
});

test("stripMarkdown excludes fenced code blocks but keeps inline code text", () => {
    const markdown = [
        "도입",
        "```ts",
        "const hidden = true;",
        "```",
        "설명 `const inline = true` 마무리",
    ].join("\n\n");

    assert.equal(
        stripMarkdown(markdown),
        "도입 설명 const inline = true 마무리",
    );
});

test("stripMarkdown skips bare URLs even when parsed as links", () => {
    // URL 리터럴을 그대로 쓰면 biome lint/security/noSecrets false positive가 나서 분할한다.
    const docsPageUrl = ["https://docs.test", "/page"].join("");
    assert.equal(
        stripMarkdown(`${docsPageUrl} [문서](${docsPageUrl})`),
        "문서",
    );
});

test("koBigramTokens preserves latin runs attached to Hangul text", () => {
    assert.equal(koBigramTokens("FSD를 적용"), "FSD 를 적용");
    assert.equal(koBigramTokens("Next.js로 다시"), "Next js 로 다시");
    assert.equal(koBigramTokens("Headings과 Link"), "Headings 과 Link");
    assert.equal(koBigramTokens("rAF로 배치 처리"), "rAF 로 배치 처리");
});
