export type SearchDoc = {
    slug: string;
    title: string;
    summary: string;
    tags: string[];
    publishedAt: string;
    lastModifiedAt: string;
    highlighted: boolean;

    // 인덱싱용 필드(토큰 문자열)
    titleTokens: string;
    summaryTokens: string;
    tagsTokens: string;
    bodyTokens: string;
};

export type SearchHit = {
    slug: string;
    title: string;
    summary: string;
    tags: string[];
    publishedAt: string;
    lastModifiedAt: string;
    highlighted: boolean;
    score: number;
    terms: string[];
    queryTerms: string[];
    match: Record<string, string[]>;
};

export type SearchResponse = {
    query: string;
    total: number;
    limit: number;
    results: SearchHit[];
};
