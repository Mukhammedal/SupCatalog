import { ProductDetailPage } from "../../product-detail-page";

export const revalidate = 30;

type RetailProductPageProps = {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
};

export default function RetailProductPage(props: RetailProductPageProps) {
  return <ProductDetailPage {...props} mode="retail" />;
}
