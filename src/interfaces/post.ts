export interface Post {
    slug: string;
    title: string;
    summary: string;
    tags?: string[];
    publishedAt: string;
    lastModifiedAt: string;
    content: string;
    highlighted?: boolean;
}
