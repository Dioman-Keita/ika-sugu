import ProductListSec from "@/components/common/ProductListSec";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import { getProductPageAction } from "@/app/actions/catalog";
import { notFound, redirect } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const productId = params.slug[0];
  const requestedSlug = params.slug[1];
  const productData = await getProductPageAction(productId);

  if (!productData?.product.title) {
    notFound();
  }

  if (!requestedSlug || requestedSlug !== productData.product.slug) {
    redirect(`/shop/product/${productId}/${productData.product.slug}`);
  }

  return (
    <main>
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbProduct title={productData.product.title ?? "product"} />
        <section className="mb-11">
          <Header data={productData.product} />
        </section>
        <Tabs reviews={productData.reviews} />
      </div>
      <div className="mb-[50px] sm:mb-20">
        <ProductListSec
          title="You might also like"
          data={productData.relatedProducts}
        />
      </div>
    </main>
  );
}
