import assert from "node:assert/strict";
import test from "node:test";
import { koBigramTokens } from "./ko-ngram";

test("koBigramTokens normalizes latin runs attached to Hangul text", () => {
    assert.equal(koBigramTokens("FSD를 적용"), "fsd 를 적용");
    assert.equal(koBigramTokens("Next.js로 다시"), "next js 로 다시");
    assert.equal(koBigramTokens("Headings과 Link"), "headings 과 link");
    assert.equal(koBigramTokens("rAF로 배치 처리"), "raf 로 배치 처리");
});
