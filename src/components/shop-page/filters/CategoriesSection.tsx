"use client";

import Link from "next/link";
import { MdKeyboardArrowRight } from "react-icons/md";
import { Locale } from "@/lib/i18n/messages";
import React from "react";
import { useSearchParams } from "next/navigation";

type Category = { id: string; slug: string; name: string };

const CategoriesSection = ({ locale = "en" }: { locale?: Locale }) => {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const searchParams = useSearchParams();

  const buildCategoryHref = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", slug);
    params.delete("page");
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    setCategories(null);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/categories?locale=${locale}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
        const data = (await res.json()) as { categories: Category[] };
        if (cancelled) return;
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load categories");
        setCategories([]);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locale]);

  return (
    <div className="flex flex-col space-y-0.5 text-muted-foreground">
      {error && <p className="text-sm text-muted-foreground py-2">{error}</p>}
      {!categories &&
        Array.from({ length: 6 }, (_, idx) => (
          <div key={idx} className="py-2">
            <div className="h-4 w-3/4 rounded bg-foreground/10" />
          </div>
        ))}
      {categories?.map((category) => (
        <Link
          key={category.id}
          href={buildCategoryHref(category.slug)}
          className="flex items-center justify-between py-2 hover:text-foreground transition-colors"
        >
          {category.name} <MdKeyboardArrowRight />
        </Link>
      ))}
    </div>
  );
};

export default CategoriesSection;
