import ProductListSec from "@/components/common/ProductListSec";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import { getProductPageAction } from "@/app/actions/catalog";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const productData = await getProductPageAction(params.slug[0]);

  if (!productData?.product.title) {
    notFound();
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
