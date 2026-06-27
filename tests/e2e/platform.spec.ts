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

async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

function testImageFile(name: string) {
  return {
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ),
    mimeType: "image/png",
    name,
  };
}

test("full platform flow from admin to buyer order", async ({ page }) => {
  const state = await loadState();
  await login(page, state.admin.email, state.admin.password);

  await expect(page).toHaveURL(/\/admin$/);

  const unique = Date.now().toString(36);
  const tenantSlug = `created-${unique}`;
  const sellerEmail = `created-${unique}@example.com`;
  const shopName = `Created Full Shop ${unique}`;
  const updatedShopName = `Full Flow Shop ${unique}`;
  const productName = `Full Flow Product ${unique}`;
  const categoryName = `Full Flow Category ${unique}`;

  await page.getByLabel("Название магазина").fill(shopName);
  await page.getByLabel("Slug").fill(tenantSlug);
  await page.getByLabel("Email клиента").fill(sellerEmail);
  await page.getByLabel("WhatsApp").fill("77009990123");
  await page.getByRole("button", { name: "Создать клиента" }).click();

  await expect(page.getByText(`Каталог: /${tenantSlug}`)).toBeVisible({
    timeout: 15000,
  });

  const passwordText =
    (await page.getByText(/^Временный пароль:/).textContent()) ?? "";
  const sellerPassword = passwordText
    .replace(/^Временный пароль:\s*/, "")
    .trim();
  expect(sellerPassword).toBeTruthy();

  await clearSession(page);
  await login(page, sellerEmail, sellerPassword, "/login?seller=1");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Кабинет продавца").first()).toBeVisible();

  await page.locator("aside").getByRole("link", { name: "⚙ Настройки" }).click();
  await page.getByLabel("Название").fill(updatedShopName);
  await page.getByLabel("Описание").fill("Full e2e storefront description.");
  await page.getByLabel("Телефон").fill("77009990124");
  await page.getByLabel("Адрес").fill("Almaty, full flow address");
  await page.getByLabel("Instagram").fill("https://instagram.com/full-flow");
  await page.getByLabel("TikTok").fill("https://tiktok.com/@full-flow");
  await page.getByRole("button", { name: "Сохранить магазин" }).click();

  await expect(page.getByText("Настройки магазина сохранены.")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByLabel("Название")).toHaveValue(updatedShopName);

  await page.goto("/dashboard/categories");
  await page.getByPlaceholder("Например: Наушники").fill(categoryName);
  await page.getByRole("button", { name: "Добавить" }).click();
  await expect(page.getByText(categoryName)).toBeVisible();

  await page.goto("/dashboard/products/new");
  await page.getByLabel("Название товара").fill(productName);
  await page.locator('input[name="retailPrice"]').fill("19900");
  await page.getByLabel("Оптовая цена").fill("15900");
  await page.getByLabel("Количество").fill("7");
  await page.locator('input[name="photos"]').setInputFiles([
    testImageFile("full-flow-main.png"),
    testImageFile("full-flow-second.png"),
  ]);
  await expect(page.getByText("Выбрано 2/12.")).toBeVisible();

  await page.getByText("Дополнительно: описание, артикул, категория").click();
  await page.getByLabel("Артикул").fill(`FF-${unique}`);
  await page.getByLabel("Описание").fill("Created in the full e2e flow.");
  await page.getByLabel("Категория").selectOption({ label: categoryName });
  await page.getByRole("button", { name: "Добавить товар" }).click();

  await expect(page).toHaveURL(/\/dashboard\/products$/);
  await expect(page.getByText(productName)).toBeVisible({ timeout: 15000 });

  await page
    .getByPlaceholder("Поиск: название, артикул, описание")
    .fill(productName);
  const fullFlowProductCard = page.locator("article", {
    has: page.getByRole("heading", { name: productName }),
  });
  await fullFlowProductCard.locator("summary").click();
  const existingPhotosSection = fullFlowProductCard.locator("section", {
    hasText: "Текущие фото",
  });
  await expect(existingPhotosSection).toBeVisible();
  await expect(existingPhotosSection.getByText("2/12")).toBeVisible();
  await fullFlowProductCard
    .getByRole("button", { name: "Удалить фото 1" })
    .click();
  await expect(existingPhotosSection.getByText("1/12")).toBeVisible();
  await fullFlowProductCard.locator('input[name="photos"]').setInputFiles(
    testImageFile("full-flow-third.png"),
  );
  await expect(fullFlowProductCard.getByText(/Выбрано 2\/12\./)).toBeVisible();
  await fullFlowProductCard
    .getByRole("button", { name: "Сохранить товар" })
    .click();

  await expect(page.getByText(productName)).toBeVisible({ timeout: 15000 });

  await page.goto(`/${tenantSlug}`);
  await expect(page.getByRole("link", { name: "Панель" })).toBeVisible();
  await expect(page.locator("header a").filter({ hasText: updatedShopName }).first()).toBeVisible();
  await expect(page.getByText(productName)).toBeVisible();
  await expect(page.getByAltText(productName).first()).toBeVisible();

  await page.getByRole("link", { name: productName }).first().click();
  await expect(page.getByRole("heading", { name: productName })).toBeVisible();
  await expect(page.getByRole("button", { name: "Фото 2" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Фото 3" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Заказать в WhatsApp" })).toHaveAttribute(
    "href",
    /wa\.me\/77009990123/,
  );

  await page.getByRole("link", { name: "Назад к каталогу" }).click();
  await page.getByRole("button", { name: "В корзину" }).click();
  await expect(page.getByRole("button", { name: /Корзина · 1/ })).toBeVisible();
  await expect(page.getByText(productName).last()).toBeVisible();

  await page.evaluate(() => {
    const testWindow = window as Window & { __lastOpenedUrl?: string };
    testWindow.__lastOpenedUrl = "";
    window.open = (url?: string | URL) => {
      testWindow.__lastOpenedUrl = String(url ?? "");
      return null;
    };
  });
  await page.getByRole("button", { name: "Заказать через WhatsApp" }).click();
  const openedUrl = await page.evaluate(() => {
    const testWindow = window as Window & { __lastOpenedUrl?: string };
    return testWindow.__lastOpenedUrl ?? "";
  });
  expect(openedUrl).toContain("https://wa.me/77009990123");
  expect(decodeURIComponent(openedUrl)).toContain(productName);
});

test("admin can manage tenants and client passwords", async ({ page }) => {
  const state = await loadState();
  await login(page, state.admin.email, state.admin.password);

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Продавцы и подписки" })).toBeVisible();

  const adminTenantCard = page.locator("article", {
    has: page.getByRole("heading", { name: state.adminTenant.name }),
  });
  await expect(adminTenantCard).toContainText(state.adminTenant.slug);

  const clientCard = page.locator("article", {
    hasText: state.adminClient.email,
  }).first();
  const resetForm = clientCard.locator("form").filter({ hasText: state.adminClient.email }).first();
  await resetForm.getByRole("button", { name: "Новый" }).click();
  await expect(resetForm).toContainText("Новый пароль создан.");
  await resetForm.getByRole("button", { name: "Смотреть" }).click();

  const passwordText = (await clientCard.locator("div.rounded-lg p").nth(1).textContent()) ?? "";
  const newPassword = passwordText.replace(/^Пароль:\s*/, "").trim();
  expect(newPassword).not.toBe("••••••••••");
  expect(newPassword).toBeTruthy();

  const unique = Date.now().toString(36);
  const createdSlug = `created-${unique}`;
  const createdEmail = `created-${unique}@example.com`;

  await page.goto("/admin");
  await page.getByLabel("Название магазина").fill(`Created Shop ${unique}`);
  await page.getByLabel("Slug").fill(createdSlug);
  await page.getByLabel("Email клиента").fill(createdEmail);
  await page.getByLabel("WhatsApp").fill("77009990000");
  await page.getByRole("button", { name: "Создать клиента" }).click();

  await expect(page.getByText(`Каталог: /${createdSlug}`)).toBeVisible({
    timeout: 15000,
  });
  await page.goto(`/${createdSlug}`);
  await expect(page.getByRole("heading", { name: "Скоро здесь появятся товары" })).toBeVisible();

  await clearSession(page);
  await login(page, state.adminClient.email, newPassword, "/login?seller=1");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Кабинет продавца").first()).toBeVisible();
});

test("admin can search sellers and confirm archiving", async ({ page }) => {
  const state = await loadState();
  await login(page, state.admin.email, state.admin.password);

  await expect(page).toHaveURL(/\/admin$/);

  const unique = Date.now().toString(36);
  const createdSlug = `created-${unique}`;
  const createdEmail = `created-${unique}@example.com`;
  const shopName = `Searchable Shop ${unique}`;

  await page.getByLabel("Название магазина").fill(shopName);
  await page.getByLabel("Slug").fill(createdSlug);
  await page.getByLabel("Email клиента").fill(createdEmail);
  await page.getByLabel("WhatsApp").fill("77009990002");
  await page.getByRole("button", { name: "Создать клиента" }).click();

  await expect(page.getByText(`Каталог: /${createdSlug}`)).toBeVisible({
    timeout: 15000,
  });

  await page.getByPlaceholder("Поиск: название, slug, email").fill(createdSlug);
  await expect(page.getByRole("heading", { name: shopName })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: state.seller.tenantName }),
  ).toHaveCount(0);

  const createdCard = page.locator("article", {
    has: page.getByRole("heading", { name: shopName }),
  });
  await createdCard.getByRole("button", { name: "Архив" }).click();
  await expect(
    createdCard.getByRole("button", { name: "Подтвердить архив" }),
  ).toBeVisible();
  await createdCard.getByRole("button", { name: "Подтвердить архив" }).click();

  await expect(page.getByRole("heading", { name: shopName })).toBeVisible({
    timeout: 15000,
  });
  await expect(createdCard).toContainText("archived");

  await page.getByPlaceholder("Поиск: название, slug, email").fill(createdSlug);
  await page.getByRole("button", { name: "Активные" }).click();
  await expect(page.getByRole("heading", { name: shopName })).toHaveCount(0);

  await page.getByRole("button", { name: "Архив" }).click();
  await expect(page.getByRole("heading", { name: shopName })).toBeVisible();
});

test("seller can update store settings and catalog", async ({ page }) => {
  const state = await loadState();
  await login(page, state.seller.email, state.seller.password);

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.locator("aside").getByRole("link", { name: "⚙ Настройки" }).click();

  await page.getByLabel("Описание").fill("Updated from Playwright.");
  await page.getByLabel("Телефон").fill("77009990001");
  await page.getByLabel("Адрес").fill("Astana");
  await page.getByLabel("Instagram").fill("https://instagram.com/updated-shop");
  await page.getByLabel("TikTok").fill("https://tiktok.com/@updated-shop");
  await page.getByRole("button", { name: "Сохранить магазин" }).click();

  await expect(page.getByText("Настройки магазина сохранены.")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByLabel("Телефон")).toHaveValue("77009990001");
  await expect(page.getByLabel("Адрес")).toHaveValue("Astana");
  await expect(page.getByLabel("Instagram")).toHaveValue(
    "https://instagram.com/updated-shop",
  );
  await expect(page.getByLabel("TikTok")).toHaveValue("https://tiktok.com/@updated-shop");

  await page.goto("/dashboard/categories");
  const newCategory = `Audio ${Date.now().toString(36)}`;
  await page.getByPlaceholder("Например: Наушники").fill(newCategory);
  await page.getByRole("button", { name: "Добавить" }).click();
  await expect(page.getByText(newCategory)).toBeVisible();

  await page.goto("/dashboard/products/new");
  await page.getByLabel("Название товара").fill("Wireless Headphones Pro");
  await page.locator('input[name="retailPrice"]').fill("27900");
  await page.getByLabel("Оптовая цена").fill("23900");
  await page.getByLabel("Количество").fill("18");
  await page.getByText("Дополнительно: описание, артикул, категория").click();
  await page.getByLabel("Артикул").fill("WH-PRO");
  await page.getByLabel("Описание").fill("Created during e2e test.");
  await page.getByLabel("Категория").selectOption({ label: newCategory });
  await page.getByRole("button", { name: "Добавить товар" }).click();

  await expect(page).toHaveURL(/\/dashboard\/products$/);
  await expect(page.getByText("Wireless Headphones Pro")).toBeVisible();

  const productCard = page.locator("article", {
    hasText: "Wireless Headphones Pro",
  }).first();
  await productCard.locator("summary").click();
  await expect(productCard.getByLabel("Название")).toBeVisible();
  await productCard.getByLabel("Название").fill("Wireless Headphones Pro Max");
  await productCard.getByLabel("Цена").fill("28900");
  await productCard.getByRole("button", { name: "Сохранить товар" }).click();

  await expect(page.getByText("Wireless Headphones Pro Max")).toBeVisible();
  await page.goto(`/${state.seller.tenantSlug}`);
  await expect(page.locator("header a").filter({ hasText: state.seller.tenantName }).first()).toBeVisible();
  await expect(page.getByText("Wireless Headphones Pro Max")).toBeVisible();

  await page.goto("/dashboard/products");
  await page
    .getByPlaceholder("Поиск: название, артикул, описание")
    .fill("Wireless Headphones Pro Max");
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones Pro Max" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: state.seller.activeProduct.name })).toHaveCount(0);

  const updatedProductCard = page.locator("article", {
    has: page.getByRole("heading", { name: "Wireless Headphones Pro Max" }),
  });
  await updatedProductCard.getByRole("button", { name: "В архив" }).click();
  await expect(
    updatedProductCard.getByRole("button", { name: "Подтвердить архив" }),
  ).toBeVisible();
  await updatedProductCard
    .getByRole("button", { name: "Подтвердить архив" })
    .click();

  await page
    .getByPlaceholder("Поиск: название, артикул, описание")
    .fill("Wireless Headphones Pro Max");
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones Pro Max" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(updatedProductCard).toContainText("Архив");

  await page.getByRole("button", { name: /^Активные/ }).click();
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones Pro Max" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^Архив/ }).click();
  await expect(
    page.getByRole("heading", { name: "Wireless Headphones Pro Max" }),
  ).toBeVisible();
});

test("seller stays signed in after opening storefront", async ({ page }) => {
  const state = await loadState();
  await login(page, state.seller.email, state.seller.password);

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: "Магазин", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${state.seller.tenantSlug}$`));
  await expect(page.getByRole("link", { name: "Войти" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Панель" })).toBeVisible();

  await page.getByRole("link", { name: "Панель" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("link", { name: "Открыть магазин" }).click();
  await expect(page).toHaveURL(new RegExp(`/${state.seller.tenantSlug}$`));
  await expect(page.getByRole("link", { name: "Панель" })).toBeVisible();
});

test("storefront account link is scoped to the current seller", async ({
  page,
}) => {
  const state = await loadState();
  await login(page, state.admin.email, state.admin.password);

  await expect(page).toHaveURL(/\/admin$/);

  await page.goto(`/${state.seller.tenantSlug}`);
  await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Панель" })).toHaveCount(0);

  await page.goto(`/${state.seller.tenantSlug}/opt`);
  await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Панель" })).toHaveCount(0);
});

test("seller can add an inline category without submitting selected photos", async ({ page }) => {
  const state = await loadState();
  await login(page, state.seller.email, state.seller.password);

  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/products/new");
  await page.locator('input[name="photos"]').setInputFiles({
    buffer: Buffer.alloc(2 * 1024 * 1024, 1),
    mimeType: "image/jpeg",
    name: "large-photo.jpg",
  });

  await page.getByText("Дополнительно: описание, артикул, категория").click();

  const categoryName = `Inline ${Date.now().toString(36)}`;
  await page.getByPlaceholder("Новая категория").fill(categoryName);
  await page.getByTitle("Сохранить категорию").click();

  await expect(page.getByText("Категория добавлена.")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/products\/new$/);
  await expect(page.locator("select").filter({ hasText: categoryName })).toBeVisible();
});

test("public storefront supports browsing, product pages, and cart", async ({ page }) => {
  const state = await loadState();
  await page.goto(`/${state.seller.tenantSlug}`);

  await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
  await expect(page.getByText(state.seller.activeProduct.name)).toBeVisible();

  await page.getByPlaceholder("Поиск или артикул").fill(state.seller.activeProduct.article);
  await expect(page.getByText(state.seller.activeProduct.name)).toBeVisible();
  await page.getByRole("button", { name: "Сброс" }).click();

  await page.getByRole("button", { name: state.seller.category.name }).click();
  await expect(page.getByText(state.seller.activeProduct.name)).toBeVisible();

  await page.getByRole("link", { name: state.seller.activeProduct.name }).first().click();
  await expect(page.getByRole("heading", { name: state.seller.activeProduct.name })).toBeVisible();
  const orderLink = page.getByRole("link", { name: "Заказать в WhatsApp" });
  await expect(orderLink).toHaveAttribute("href", /wa\.me\//);
  await expect(orderLink).toHaveAttribute("href", new RegExp(encodeURIComponent(state.seller.activeProduct.name)));

  await page.getByRole("link", { name: "Назад к каталогу" }).click();
  const addToCart = page.locator(`button[data-add-to-cart="${state.seller.activeProduct.id}"]`);
  await addToCart.click();
  await expect(page.getByRole("button", { name: /Корзина · 1/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: state.seller.activeProduct.name }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Заказать через WhatsApp" })).toBeEnabled();
});

test("wholesale storefront uses wholesale prices and product pages", async ({
  page,
}) => {
  const state = await loadState();
  await page.goto(`/${state.seller.tenantSlug}/opt`);

  await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
  await expect(page.getByText("Опт: показано")).toBeVisible();
  await expect(page.getByText(state.seller.activeProduct.name)).toBeVisible();
  await expect(page.getByText("21 000 ₸")).toBeVisible();

  await page.getByRole("link", { name: state.seller.activeProduct.name }).first().click();
  await expect(page.getByRole("heading", { name: state.seller.activeProduct.name })).toBeVisible();
  await expect(page.getByText("Опт").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Заказать в WhatsApp" })).toBeVisible();
});
