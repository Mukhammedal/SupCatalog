import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { e2eStatePath, type E2EState } from "./state";

async function loadState() {
  return JSON.parse(await readFile(e2eStatePath, "utf8")) as E2EState;
}

async function login(
  page: Page,
  email: string,
  password: string,
  path = "/login",
) {
  await page.goto(path);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
}

test("visitor sees an error for invalid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Пароль").fill("wrong-password");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/login\?error=invalid$/);
  await expect(page.getByText("Неверный email или пароль.")).toBeVisible();
});

test("protected routes redirect anonymous visitors to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/dashboard/products/new");
  await expect(page).toHaveURL(/\/login$/);
});

test("seller cannot open the admin panel", async ({ page }) => {
  const state = await loadState();
  await login(page, state.seller.email, state.seller.password);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(async () => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
  }).toPass({ timeout: 15000 });
});
