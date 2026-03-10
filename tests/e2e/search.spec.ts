import { expect, test } from "@playwright/test";

test("posts search filters results and shows empty state", async ({ page }) => {
    await page.goto("/posts");

    const input = page.getByPlaceholder("Search posts");

    await input.fill("blog");

    await expect(page.getByText(/^1 result$/)).toBeVisible();
    await expect(page.getByRole("link", { name: /집 짓는 중/ })).toBeVisible();

    await input.fill("zzqvxxqqv");

    await expect(page.getByText(/^0 results$/)).toBeVisible();
    await expect(page.getByText("No posts found.")).toBeVisible();
});
