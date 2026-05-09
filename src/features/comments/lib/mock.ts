import type { CommentThread, PostComment } from "../model/types";

let mockCommentSequence = 0;

export const isMockCommentsEnabled = process.env.NODE_ENV === "development";

export function createMockCommentThreads(slug: string): CommentThread[] {
    return [
        {
            authorName: "장종인",
            content:
                "개발 모드에서만 보이는 mock 댓글입니다.\n줄바꿈이 댓글 본문에서 어떻게 보이는지 확인할 수 있어요.",
            createdAt: "2026-05-09T05:10:00.000Z",
            id: "mock-comment-1",
            parentId: null,
            postSlug: slug,
            replies: [
                {
                    authorName: "방문자",
                    content: "답글은 이렇게 한 단계까지만 표시됩니다.",
                    createdAt: "2026-05-09T05:12:00.000Z",
                    id: "mock-comment-1-reply-1",
                    parentId: "mock-comment-1",
                    postSlug: slug,
                },
            ],
        },
        {
            authorName: "긴 이름 테스트",
            content:
                "긴 문장과 긴단어가댓글카드안에서어떻게줄바꿈되는지확인하기위한댓글입니다. 일반 텍스트만 렌더링되고 Markdown은 해석되지 않습니다.",
            createdAt: "2026-05-09T05:18:00.000Z",
            id: "mock-comment-2",
            parentId: null,
            postSlug: slug,
            replies: [
                {
                    authorName: "답글러",
                    content: "두 번째 댓글에도 답글이 붙어 있는 상태입니다.",
                    createdAt: "2026-05-09T05:20:00.000Z",
                    id: "mock-comment-2-reply-1",
                    parentId: "mock-comment-2",
                    postSlug: slug,
                },
                {
                    authorName: "테스터",
                    content: "답글 목록 간격도 같이 볼 수 있습니다.",
                    createdAt: "2026-05-09T05:22:00.000Z",
                    id: "mock-comment-2-reply-2",
                    parentId: "mock-comment-2",
                    postSlug: slug,
                },
            ],
        },
    ];
}

export function createMockPostComment({
    authorName,
    content,
    parentId,
    slug,
}: {
    authorName: string;
    content: string;
    parentId: string | null;
    slug: string;
}): PostComment {
    mockCommentSequence += 1;

    return {
        authorName: authorName.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        id: `mock-new-comment-${mockCommentSequence}`,
        parentId,
        postSlug: slug,
    };
}
