"use client";

import { Button, Spinner, Text, TextArea, TextField } from "@radix-ui/themes";
import { Reply, Send } from "lucide-react";
import type { SyntheticEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/shared/lib";
import {
    createMockCommentThreads,
    createMockPostComment,
    isMockCommentsEnabled,
} from "../lib/mock";
import type {
    CommentThread,
    CreatePostCommentResponse,
    PostComment,
    PostCommentsResponse,
} from "../model/types";
import styles from "./PostComments.module.scss";

type CommentDraft = {
    authorName: string;
    content: string;
};

const emptyDraft = {
    authorName: "",
    content: "",
} satisfies CommentDraft;

function countComments(threads: CommentThread[]) {
    return threads.reduce(
        (total, comment) => total + 1 + comment.replies.length,
        0,
    );
}

function formatCommentDate(value: string) {
    return formatDate(value);
}

function formatCommentTime(value: string) {
    return new Intl.DateTimeFormat("ko-KR", {
        hour: "2-digit",
        hour12: true,
        minute: "2-digit",
    }).format(new Date(value));
}

function insertComment(
    threads: CommentThread[],
    comment: PostComment,
): CommentThread[] {
    if (comment.parentId === null) {
        return [
            ...threads,
            {
                ...comment,
                replies: [],
            },
        ];
    }

    return threads.map(thread => {
        if (thread.id !== comment.parentId) return thread;

        return {
            ...thread,
            replies: [...thread.replies, comment],
        };
    });
}

function CommentForm({
    error,
    isSubmitting,
    onCancel,
    onSubmit,
    submitLabel,
}: {
    error: string | null;
    isSubmitting: boolean;
    onCancel?: () => void;
    onSubmit: (draft: CommentDraft) => Promise<boolean>;
    submitLabel: string;
}) {
    const [draft, setDraft] = useState<CommentDraft>(emptyDraft);
    const canSubmit =
        draft.authorName.trim().length > 0 && draft.content.trim().length > 0;

    async function handleSubmit(
        event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
    ) {
        event.preventDefault();

        if (!canSubmit || isSubmitting) return;

        const submitted = await onSubmit(draft);

        if (submitted) {
            setDraft(emptyDraft);
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <TextField.Root
                maxLength={40}
                placeholder="이름"
                value={draft.authorName}
                onChange={event =>
                    setDraft(current => ({
                        ...current,
                        authorName: event.target.value,
                    }))
                }
            />
            <TextArea
                maxLength={1000}
                placeholder="댓글을 남겨보세요"
                resize="vertical"
                rows={4}
                value={draft.content}
                onChange={event =>
                    setDraft(current => ({
                        ...current,
                        content: event.target.value,
                    }))
                }
            />
            <div className={styles.formActions}>
                {error && (
                    <Text className={styles.error} size="2">
                        {error}
                    </Text>
                )}
                {onCancel && (
                    <Button
                        color="gray"
                        disabled={isSubmitting}
                        type="button"
                        variant="soft"
                        onClick={onCancel}
                    >
                        취소
                    </Button>
                )}
                <Button disabled={!canSubmit || isSubmitting} type="submit">
                    {isSubmitting ? <Spinner /> : <Send size={14} />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}

function CommentItem({
    comment,
    onReply,
}: {
    comment: PostComment;
    onReply?: () => void;
}) {
    return (
        <div className={styles.comment}>
            <div className={styles.commentHeader}>
                <Text weight="bold">{comment.authorName}</Text>
                <Text color="gray" size="2">
                    {formatCommentDate(comment.createdAt)}
                </Text>
                <Text color="gray" size="2" aria-hidden="true">
                    ·
                </Text>
                <Text color="gray" size="2">
                    {formatCommentTime(comment.createdAt)}
                </Text>
            </div>
            <Text as="p" className={styles.content} size="3">
                {comment.content}
            </Text>
            {onReply && (
                <div className={styles.commentActions}>
                    <Button
                        color="gray"
                        size="1"
                        type="button"
                        variant="ghost"
                        onClick={onReply}
                    >
                        <Reply size={14} />
                        답글
                    </Button>
                </div>
            )}
        </div>
    );
}

function TreeBranch({ isLast }: { isLast: boolean }) {
    return (
        <span aria-hidden="true" className={styles.branch}>
            <span
                className={[
                    styles.branchStem,
                    isLast ? styles.branchStemHalf : styles.branchStemFull,
                ].join(" ")}
            />
            <span className={styles.branchHorizontal} />
        </span>
    );
}

export function PostComments({ slug }: { slug: string }) {
    const [threads, setThreads] = useState<CommentThread[]>(() =>
        isMockCommentsEnabled ? createMockCommentThreads(slug) : [],
    );
    const [enabled, setEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(!isMockCommentsEnabled);
    const [submittingTargetId, setSubmittingTargetId] = useState<string | null>(
        null,
    );
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [formError, setFormError] = useState<{
        message: string;
        targetId: string | null;
    } | null>(null);
    const commentCount = useMemo(() => countComments(threads), [threads]);

    useEffect(() => {
        if (isMockCommentsEnabled) {
            setEnabled(true);
            setFormError(null);
            setIsLoading(false);
            setThreads(createMockCommentThreads(slug));
            return;
        }

        const controller = new AbortController();

        setIsLoading(true);
        setFormError(null);

        fetch(`/api/comments/posts/${encodeURIComponent(slug)}`, {
            cache: "no-store",
            signal: controller.signal,
        })
            .then(response => (response.ok ? response.json() : null))
            .then((payload: PostCommentsResponse | null) => {
                if (!payload) {
                    setEnabled(false);
                    setThreads([]);
                    return;
                }

                setEnabled(payload.enabled);
                setThreads(payload.comments);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setEnabled(false);
                    setThreads([]);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => controller.abort();
    }, [slug]);

    async function submitComment(draft: CommentDraft, parentId: string | null) {
        setSubmittingTargetId(parentId ?? "root");
        setFormError(null);

        try {
            if (isMockCommentsEnabled) {
                const comment = createMockPostComment({
                    authorName: draft.authorName,
                    content: draft.content,
                    parentId,
                    slug,
                });

                setThreads(current => insertComment(current, comment));
                setActiveReplyId(null);

                return true;
            }

            const response = await fetch("/api/comments", {
                body: JSON.stringify({
                    authorName: draft.authorName,
                    content: draft.content,
                    parentId,
                    slug,
                }),
                cache: "no-store",
                credentials: "same-origin",
                headers: {
                    "content-type": "application/json",
                },
                method: "POST",
            });
            const payload =
                (await response.json()) as CreatePostCommentResponse;

            if (!response.ok || !payload.ok) {
                throw new Error(
                    "error" in payload ? payload.error : "댓글 등록 실패",
                );
            }

            setThreads(current => insertComment(current, payload.comment));
            setActiveReplyId(null);

            return true;
        } catch (error) {
            setFormError({
                message:
                    error instanceof Error
                        ? error.message
                        : "댓글 등록에 실패했어요",
                targetId: parentId,
            });

            return false;
        } finally {
            setSubmittingTargetId(null);
        }
    }

    return (
        <section className={styles.comments} aria-labelledby="comments-title">
            <div className={styles.header}>
                <div className={styles.title}>
                    <Text id="comments-title" size="5" weight="bold">
                        댓글 {commentCount}
                    </Text>
                </div>
                {isLoading && (
                    <Text color="gray" size="2">
                        불러오는 중
                    </Text>
                )}
            </div>

            {!enabled ? (
                <Text as="p" className={styles.empty} size="2">
                    댓글을 잠시 불러올 수 없어요.
                </Text>
            ) : (
                <>
                    <CommentForm
                        error={
                            formError?.targetId === null
                                ? formError.message
                                : null
                        }
                        isSubmitting={submittingTargetId === "root"}
                        submitLabel="등록"
                        onSubmit={draft => submitComment(draft, null)}
                    />

                    {threads.length === 0 ? (
                        <Text as="p" className={styles.empty} size="2">
                            아직 댓글이 없어요.
                        </Text>
                    ) : (
                        <div className={styles.list}>
                            {threads.map(thread => (
                                <div className={styles.thread} key={thread.id}>
                                    <CommentItem
                                        comment={thread}
                                        onReply={() =>
                                            setActiveReplyId(thread.id)
                                        }
                                    />
                                    {(activeReplyId === thread.id ||
                                        thread.replies.length > 0) && (
                                        <ul className={styles.replies}>
                                            {activeReplyId === thread.id && (
                                                <li className={styles.replyRow}>
                                                    <TreeBranch
                                                        isLast={
                                                            thread.replies
                                                                .length === 0
                                                        }
                                                    />
                                                    <div
                                                        className={
                                                            styles.replyForm
                                                        }
                                                    >
                                                        <CommentForm
                                                            error={
                                                                formError?.targetId ===
                                                                thread.id
                                                                    ? formError.message
                                                                    : null
                                                            }
                                                            isSubmitting={
                                                                submittingTargetId ===
                                                                thread.id
                                                            }
                                                            submitLabel="답글 등록"
                                                            onCancel={() =>
                                                                setActiveReplyId(
                                                                    null,
                                                                )
                                                            }
                                                            onSubmit={draft =>
                                                                submitComment(
                                                                    draft,
                                                                    thread.id,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </li>
                                            )}
                                            {thread.replies.map(
                                                (reply, index) => (
                                                    <li
                                                        className={
                                                            styles.replyRow
                                                        }
                                                        key={reply.id}
                                                    >
                                                        <TreeBranch
                                                            isLast={
                                                                index ===
                                                                thread.replies
                                                                    .length -
                                                                    1
                                                            }
                                                        />
                                                        <CommentItem
                                                            comment={reply}
                                                        />
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
