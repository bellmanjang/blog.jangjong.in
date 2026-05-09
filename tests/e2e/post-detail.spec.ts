import { expect, test } from "@playwright/test";

const highlightedPostPath =
    "/posts/%EC%A7%91-%EC%A7%93%EB%8A%94-%EC%A4%91%EC%9E%85%EB%8B%88%EB%8B%A4";

test("post detail renders content and blogposting json-ld", async ({
    page,
}) => {
    await page.goto(highlightedPostPath);

    await expect(page.getByText("집 짓는 중...")).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "블로그 템플릿 살펴보기" }),
    ).toBeVisible();

    const jsonLd = await page
        .locator('script[type="application/ld+json"]')
        .textContent();

    expect(jsonLd).toContain('"@type":"BlogPosting"');
    expect(jsonLd).toContain(
        "/posts/%EC%A7%91-%EC%A7%93%EB%8A%94-%EC%A4%91%EC%9E%85%EB%8B%88%EB%8B%A4",
    );
    expect(jsonLd).toContain(
        "/og/posts/%EC%A7%91-%EC%A7%93%EB%8A%94-%EC%A4%91%EC%9E%85%EB%8B%88%EB%8B%A4",
    );
});

test("post comments can create a comment and one-level reply", async ({
    page,
}) => {
    let commentId = 0;

    await page.route("**/api/comments/posts/**", async route => {
        await route.fulfill({
            json: {
                comments: [],
                enabled: true,
            },
        });
    });
    await page.route("**/api/comments", async route => {
        const payload = route.request().postDataJSON() as {
            authorName: string;
            content: string;
            parentId: string | null;
            slug: string;
        };

        commentId += 1;

        await route.fulfill({
            json: {
                comment: {
                    authorName: payload.authorName,
                    content: payload.content,
                    createdAt: "2026-05-09T00:00:00.000Z",
                    id: `comment-${commentId}`,
                    parentId: payload.parentId,
                    postSlug: payload.slug,
                },
                ok: true,
            },
        });
    });

    await page.goto(highlightedPostPath);

    await expect(page.getByText("댓글 0")).toBeVisible();

    await page.getByPlaceholder("이름").fill("테스터");
    await page.getByPlaceholder("댓글을 남겨보세요").fill("반갑습니다");
    await page.getByRole("button", { name: "등록" }).click();

    await expect(page.getByText("댓글 1")).toBeVisible();
    await expect(page.getByText("테스터")).toBeVisible();
    await expect(page.getByText("반갑습니다")).toBeVisible();

    await page.getByRole("button", { name: "답글" }).click();
    await page.getByPlaceholder("이름").last().fill("답글러");
    await page.getByPlaceholder("댓글을 남겨보세요").last().fill("저도요");
    await page.getByRole("button", { name: "답글 등록" }).click();

    await expect(page.getByText("댓글 2")).toBeVisible();
    await expect(page.getByText("답글러")).toBeVisible();
    await expect(page.getByText("저도요")).toBeVisible();
});
