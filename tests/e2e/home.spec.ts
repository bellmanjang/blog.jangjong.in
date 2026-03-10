import { expect, test } from "@playwright/test";

test("home renders the highlighted post and links to the archive", async ({
    page,
}) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Posts" })).toBeVisible();
    await expect(page.getByRole("link", { name: /집 짓는 중/ })).toBeVisible();

    await page.getByRole("link", { name: "Posts" }).click();

    await expect(page).toHaveURL(/\/posts$/);
    await expect(page.getByPlaceholder("Search posts")).toBeVisible();
});
