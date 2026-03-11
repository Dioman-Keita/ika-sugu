import BreadcrumbShop from "@/components/shop-page/BreadcrumbShop";
import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MobileFilters from "@/components/shop-page/filters/MobileFilters";
import Filters from "@/components/shop-page/filters";
import { FiSliders } from "react-icons/fi";
import { getShopProductsAction } from "@/app/actions/catalog";
import ProductCard from "@/components/common/ProductCard";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { messages } from "@/lib/i18n/messages";
import { Locale, parseLocale } from "@/lib/i18n/locale";

const PAGE_SIZE = 9;
export const dynamic = "force-dynamic";

const getPageParam = (value?: string | string[]): number => {
  if (!value) return 1;
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
};

const sectionTitles: Record<string, string> = {
  "men-clothes": "nav.men",
  "women-clothes": "nav.women",
  "kids-clothes": "nav.kids",
  "bag-shoes": "nav.bagsShoes",
  "on-sale": "nav.onSale",
  "new-arrivals": "nav.newArrivals",
  brands: "nav.brands",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);

  const buildPageHref = (page: number): string => {
    const params = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (!value || key === "page") return;
      const firstValue = Array.isArray(value) ? value[0] : value;
      params.set(key, firstValue);
    });
    params.set("page", String(page));
    return `/shop?${params.toString()}`;
  };

  const requestedPage = getPageParam(resolvedSearchParams.page);
  const sectionParam = Array.isArray(resolvedSearchParams.section)
    ? resolvedSearchParams.section[0]
    : resolvedSearchParams.section;

  const sectionKey = (sectionParam && sectionTitles[sectionParam]) || null;
  const pageTitle = sectionKey
    ? messages[locale][sectionKey] || sectionKey
    : messages[locale]["nav.shop"];

  const { products, totalProducts, totalPages } = await getShopProductsAction({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    locale,
  });
  const currentPage = Math.min(requestedPage, totalPages);
  const startProduct = totalProducts === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endProduct = Math.min(currentPage * PAGE_SIZE, totalProducts);
  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-px border-t-black/10 dark:border-t-white/10 mb-5 sm:mb-6" />
        <BreadcrumbShop />
        <div className="flex md:space-x-5 items-start">
          <div className="hidden md:block min-w-73.75 max-w-73.75 border border-border rounded-[20px] px-5 md:px-6 py-5 space-y-5 md:space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-xl">
                {messages[locale]["shop.filters"]}
              </span>
              <FiSliders className="text-2xl text-foreground/40" />
            </div>
            <Filters locale={locale} />
          </div>
          <div className="flex flex-col w-full space-y-5">
            <div className="flex flex-col lg:flex-row lg:justify-between">
              <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl md:text-[32px]">{pageTitle}</h1>
                <MobileFilters locale={locale} />
              </div>
              <div className="flex flex-col sm:items-center sm:flex-row">
                <span className="text-sm md:text-base text-muted-foreground mr-3">
                  {messages[locale]["shop.showing"]
                    .replace("{start}", String(startProduct))
                    .replace("{end}", String(endProduct))
                    .replace("{total}", String(totalProducts))}
                </span>
                <div className="flex items-center">
                  {messages[locale]["shop.sortBy"]}
                  <Select defaultValue="most-popular">
                    <SelectTrigger className="font-medium text-sm px-1.5 sm:text-base w-fit text-foreground bg-transparent shadow-none border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="most-popular">
                        {messages[locale]["shop.mostPopular"]}
                      </SelectItem>
                      <SelectItem value="low-price">
                        {messages[locale]["shop.lowPrice"]}
                      </SelectItem>
                      <SelectItem value="high-price">
                        {messages[locale]["shop.highPrice"]}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {products.length > 0 ? (
              <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} data={product} />
                ))}
              </div>
            ) : (
              <div className="w-full py-10 text-center border border-border rounded-[20px]">
                <p className="text-muted-foreground text-sm sm:text-base">
                  {messages[locale]["shop.noProducts"]}
                </p>
              </div>
            )}
            <hr className="border-t-border" />
            <Pagination className="justify-between">
              <PaginationPrevious
                href={buildPageHref(Math.max(1, currentPage - 1))}
                className="border border-border"
                label={messages[locale]["pagination.previous"]}
                ariaLabel={messages[locale]["pagination.goToPreviousPage"]}
              />
              <PaginationContent>
                {pageNumbers.map((page, idx) => {
                  const previous = pageNumbers[idx - 1];
                  const showEllipsis =
                    typeof previous === "number" && page - previous > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <PaginationItem>
                          <PaginationEllipsis className="text-muted-foreground font-medium text-sm" />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href={buildPageHref(page)}
                          className="text-muted-foreground font-medium text-sm"
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                })}
              </PaginationContent>
              <PaginationNext
                href={buildPageHref(Math.min(totalPages, currentPage + 1))}
                className="border border-border"
                label={messages[locale]["pagination.next"]}
                ariaLabel={messages[locale]["pagination.goToNextPage"]}
              />
            </Pagination>
          </div>
        </div>
      </div>
    </main>
  );
}
