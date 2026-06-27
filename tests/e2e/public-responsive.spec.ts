import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { e2eStatePath, type E2EState } from "./state";

async function loadState() {
  return JSON.parse(await readFile(e2eStatePath, "utf8")) as E2EState;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const pageWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    );

    return pageWidth - viewportWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

test("public storefront remains usable across responsive viewports", async ({
  page,
}) => {
  const state = await loadState();
  await page.goto(`/${state.seller.tenantSlug}`);

  await expect(page.locator("header")).toBeVisible();
  await expect(page.getByPlaceholder("Поиск или артикул")).toBeVisible();
  await expect(page.getByRole("button", { name: "Все товары" })).toBeVisible();
  await expect(page.getByText(state.seller.activeProduct.name)).toBeVisible();
  await expect(page.getByRole("button", { name: /Корзина · 0/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByPlaceholder("Поиск или артикул").fill(state.seller.activeProduct.article);
  await expect(page.getByText(state.seller.activeProduct.name)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.locator(`button[data-add-to-cart="${state.seller.activeProduct.id}"]`).click();
  const cart = page.locator("aside", {
    has: page.getByRole("heading", { name: "Корзина" }),
  });
  await expect(cart).toBeVisible();
  await expect(cart.getByText(state.seller.activeProduct.name)).toBeVisible();
  await expect(cart.getByRole("button", { name: "Заказать через WhatsApp" })).toBeEnabled();
  await expectNoHorizontalOverflow(page);
});
