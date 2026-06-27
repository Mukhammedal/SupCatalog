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

async function expectVisibleElementsFitViewport(page: Page, selector: string) {
  const overflowing = await page.locator(selector).evaluateAll((elements) => {
    const viewportWidth = document.documentElement.clientWidth;

    return elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();

        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          left: rect.left,
          right: rect.right,
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().slice(0, 80) ?? "",
          width: rect.width,
        };
      })
      .filter((rect) => rect.left < -1 || rect.right > viewportWidth + 1);
  });

  expect(overflowing).toEqual([]);
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
  await expectVisibleElementsFitViewport(page, "header, form, article");

  await page.getByPlaceholder("Поиск или артикул").fill(state.seller.activeProduct.article);
  await expect(page.getByText(state.seller.activeProduct.name)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectVisibleElementsFitViewport(page, "header, form, article");

  await page.locator(`button[data-add-to-cart="${state.seller.activeProduct.id}"]`).click();
  const cart = page.locator("aside", {
    has: page.getByRole("heading", { name: "Корзина" }),
  });
  await expect(cart).toBeVisible();
  await expect(cart.getByText(state.seller.activeProduct.name)).toBeVisible();
  await expect(cart.getByRole("button", { name: "Заказать через WhatsApp" })).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await expectVisibleElementsFitViewport(page, "header, aside");
});

test("seller login remains usable across responsive viewports", async ({
  page,
}) => {
  await page.goto("/login?seller=1");

  await expect(page.getByRole("heading", { name: "Войти" })).toBeVisible();
  await expect(page.getByPlaceholder("email@example.com")).toBeVisible();
  await expect(page.getByPlaceholder("Введите пароль")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectVisibleElementsFitViewport(page, "main, form");
});
