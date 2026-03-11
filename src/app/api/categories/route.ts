import { NextResponse } from "next/server";
import { getCategoriesAction } from "@/app/actions/catalog";
import { parseLocale } from "@/lib/i18n/locale";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = parseLocale(url.searchParams.get("locale"));

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
