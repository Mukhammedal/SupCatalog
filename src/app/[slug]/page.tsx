import { CatalogPage } from "./catalog-page";

export const revalidate = 30;

type RetailCatalogPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    stock?: string;
  }>;
};

export default function RetailCatalogPage(props: RetailCatalogPageProps) {
  return <CatalogPage {...props} mode="retail" />;
}
