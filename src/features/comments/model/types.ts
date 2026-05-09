export type PostComment = {
    id: string;
    postSlug: string;
    parentId: string | null;
    authorName: string;
    content: string;
    createdAt: string;
};

export type CommentThread = PostComment & {
    replies: PostComment[];
};

export type PostCommentsResponse = {
    enabled: boolean;
    comments: CommentThread[];
};

export type CreatePostCommentResponse =
    | {
          ok: true;
          comment: PostComment;
      }
    | {
          ok: false;
          error: string;
      };
