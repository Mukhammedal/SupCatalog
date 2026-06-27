import { CatalogPage } from "../catalog-page";

export const revalidate = 30;

type WholesaleCatalogPageProps = {
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

export default function WholesaleCatalogPage(props: WholesaleCatalogPageProps) {
  return <CatalogPage {...props} mode="wholesale" />;
}
