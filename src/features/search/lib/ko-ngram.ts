const SEARCH_RUN_RE = /[a-z0-9]+|[가-힣]+/gi;
const HANGUL_RUN_RE = /[가-힣]+$/;

export function normalizeText(s: string) {
    return (s ?? "").toString().normalize("NFKC").replace(/\s+/g, " ").trim();
}

/**
 * sliding window n-gram
 * - n=2면 bigram
 * - 겹치도록 생성: s[i:i+n]
 */
function ngrams(s: string, n: number) {
    const out: string[] = [];
    if (!s) return out;
    if (s.length <= n) return [s]; // 짧으면 그대로(선호에 따라 빈 배열로 해도 됨)
    for (let i = 0; i <= s.length - n; i++) out.push(s.slice(i, i + n));
    return out;
}

/**
 * 한국어 bigram + 기타 토큰 혼합:
 * - 한글 연속 구간은 bigram(겹치게)
 * - 비한글은 단어 토큰(영/숫자) + 원하면 2-gram도 추가 가능
 *
 * MiniSearch에 넣기 위해 최종적으로 "token token ..." 문자열을 반환
 */
export function koBigramTokens(text: string) {
    const t = normalizeText(text);
    if (!t) return "";

    const tokens: string[] = [];

    for (const run of t.match(SEARCH_RUN_RE) ?? []) {
        if (HANGUL_RUN_RE.test(run)) {
            tokens.push(...ngrams(run, 2)); // 핵심: 겹치게 sliding
            continue;
        }

        tokens.push(run.toLowerCase());
    }

    return tokens.join(" ");
}
