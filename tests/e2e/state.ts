import path from "node:path";

export const e2eStatePath = path.join(
  process.cwd(),
  ".playwright",
  "e2e-state.json",
);

export type E2EState = {
  admin: {
    email: string;
    password: string;
  };
  adminTenant: {
    categoryId: string;
    id: string;
    name: string;
    productId: string;
    slug: string;
  };
  adminClient: {
    email: string;
    password: string;
    tenantId: string;
  };
  lead: {
    id: string;
    shopName: string;
  };
  seller: {
    email: string;
    password: string;
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    activeProduct: {
      id: string;
      article: string;
      name: string;
    };
    archivedProduct: {
      id: string;
      article: string;
      name: string;
    };
    category: {
      id: string;
      name: string;
    };
  };
};
