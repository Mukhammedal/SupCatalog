import { ProductDetailPage } from "../../../product-detail-page";

export const revalidate = 30;

type WholesaleProductPageProps = {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
};

export default function WholesaleProductPage(props: WholesaleProductPageProps) {
  return <ProductDetailPage {...props} mode="wholesale" />;
}
