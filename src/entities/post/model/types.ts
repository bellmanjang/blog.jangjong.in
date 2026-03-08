export type Post = {
    slug: string;
    title: string;
    summary: string;
    tags?: string[];
    publishedAt: string;
    lastModifiedAt: string;
    content: string;
    highlighted?: boolean;
};

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
