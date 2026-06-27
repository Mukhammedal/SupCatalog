import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.LOAD_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const storeSlug = __ENV.LOAD_STORE_SLUG || "test-shop";
const productPath = __ENV.LOAD_PRODUCT_PATH || "";
const profile = __ENV.LOAD_PROFILE || "smoke";

const profiles = {
  smoke: [
    { duration: "30s", target: 25 },
    { duration: "30s", target: 25 },
    { duration: "15s", target: 0 },
  ],
  ramp500: [
    { duration: "2m", target: 100 },
    { duration: "3m", target: 500 },
    { duration: "3m", target: 500 },
    { duration: "1m", target: 0 },
  ],
  full5000: [
    { duration: "5m", target: 500 },
    { duration: "10m", target: 2000 },
    { duration: "10m", target: 5000 },
    { duration: "10m", target: 5000 },
    { duration: "5m", target: 0 },
  ],
};

export const options = {
  scenarios: {
    catalog_browse: {
      executor: "ramping-vus",
      stages: profiles[profile] || profiles.smoke,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500"],
  },
};

export default function catalogLoad() {
  const storefront = http.get(`${baseUrl}/${storeSlug}`);
  check(storefront, {
    "storefront is 200": (response) => response.status === 200,
    "storefront has catalog": (response) =>
      response.body.includes("Категории") || response.body.includes("Товары"),
  });

  const productLink =
    productPath ||
    storefront.body.match(new RegExp(`/${storeSlug}/products/[^"?#]+`))?.[0];

  if (productLink) {
    const product = http.get(`${baseUrl}${productLink}`);
    check(product, {
      "product page is 200": (response) => response.status === 200,
      "product page has order action": (response) =>
        response.body.includes("WhatsApp") || response.body.includes("В корзину"),
    });
  }

  sleep(1);
}
