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
