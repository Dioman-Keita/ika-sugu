import ProductListSec from "@/components/common/ProductListSec";
import Brands from "@/components/homepage/Brands";
import DressStyle from "@/components/homepage/DressStyle";
import Header from "@/components/homepage/Header";
import Reviews from "@/components/homepage/Reviews";
import { getHomeCatalogAction } from "@/app/actions/catalog";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { PRODUCT_QUERY_KEYS } from "@/hooks/query-keys";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);

  const queryClient = new QueryClient();

  // Prefetch data on the server
  await queryClient.prefetchQuery({
    queryKey: [...PRODUCT_QUERY_KEYS.home, locale],
    queryFn: () => getHomeCatalogAction(locale),
  });

  const { newArrivalsData, topSellingData, reviewsData } = await queryClient.fetchQuery({
    queryKey: [...PRODUCT_QUERY_KEYS.home, locale],
    queryFn: () => getHomeCatalogAction(locale),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Header />
      <Brands />
      <main className="my-[50px] sm:my-[72px]">
        <ProductListSec
          titleKey="home.arrivals"
          data={newArrivalsData}
          viewAllLink="/shop#new-arrivals"
        />
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <hr className="h-px border-t-black/10 dark:border-t-white/10 my-10 sm:my-16" />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <ProductListSec
            titleKey="home.topSelling"
            data={topSellingData}
            viewAllLink="/shop#top-selling"
          />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <DressStyle />
        </div>
        <Reviews data={reviewsData} />
      </main>
    </HydrationBoundary>
  );
}
