import ProductListSec from "@/components/common/ProductListSec";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import { getProductPageAction } from "@/app/actions/catalog";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale } from "@/lib/i18n/messages";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE_KEY)?.value as Locale) || "en";

  const resolvedParams = await params;
  const productId = resolvedParams.slug[0];
  const requestedSlug = resolvedParams.slug[1];
  const productData = await getProductPageAction(productId, locale);

  if (!productData?.product.title) {
    notFound();
  }

  if (!requestedSlug || requestedSlug !== productData.product.slug) {
    redirect(`/shop/product/${productId}/${productData.product.slug}`);
  }

  return (
    <main>
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-px border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbProduct title={productData.product.title ?? "product"} />
        <section className="mb-11">
          <Header data={productData.product} />
        </section>
        <Tabs reviews={productData.reviews} specs={productData.product.specs} />
      </div>
      <div className="mb-[50px] sm:mb-20">
        <ProductListSec titleKey="product.related" data={productData.relatedProducts} />
      </div>
    </main>
  );
}
