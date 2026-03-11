import { NextResponse } from "next/server";
import { getCategoriesAction } from "@/app/actions/catalog";
import type { Locale } from "@/lib/i18n/messages";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("locale");
  const locale: Locale = rawLocale === "fr" ? "fr" : "en";

  const categories = await getCategoriesAction(locale);

  return NextResponse.json(
    { categories },
    {
      headers: {
        // Categories are cheap; avoid confusing stale UI while developing.
        "Cache-Control": "no-store",
      },
    },
  );
}
