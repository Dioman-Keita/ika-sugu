import Link from "next/link";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";

export default async function NotFound() {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  return (
    <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-20 bg-gradient-to-b from-background via-background to-background">
      <div className="text-center space-y-6 max-w-[420px]">
        <div className="relative inline-block">
          <div className="absolute -inset-6 blur-3xl bg-primary/10" aria-hidden />
          <h1
            className={cn(
              integralCF.className,
              "relative text-[96px] xs:text-[120px] md:text-[150px] leading-none font-bold text-foreground/90 select-none drop-shadow-sm",
            )}
          >
            404
          </h1>
        </div>

        <div className="w-16 h-1 bg-primary/70 rounded-full mx-auto" />

        <div className="space-y-3">
          <h2
            className={cn(
              integralCF.className,
              "text-xl md:text-2xl font-bold text-foreground",
            )}
          >
            {m["notFound.title"]}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {m["notFound.subtitle"]}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
          <Button asChild className="rounded-full h-[48px] px-6">
            <Link href="/">{m["notFound.home"]}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full h-[48px] px-6">
            <Link href="/shop">{m["notFound.shop"]}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
