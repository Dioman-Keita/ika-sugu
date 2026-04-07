import Link from "next/link";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { parseLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import * as motion from "framer-motion/client";
import { X } from "lucide-react";

export default async function CheckoutCancelPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  const locale = parseLocale(cookieLocale) || "en";
  const t = getMessages(locale);

  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-24 h-24 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center mb-8"
      >
        <X className="w-12 h-12 text-red-600 dark:text-red-400" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h1
          className={cn(
            integralCF.className,
            "text-4xl md:text-5xl text-foreground uppercase tracking-tight",
          )}
        >
          {t("checkout.cancel.title")}
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          {t("checkout.cancel.description")}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12"
      >
        <Link
          href="/cart"
          className="inline-flex items-center justify-center bg-foreground text-background rounded-full px-12 py-4 font-semibold text-base hover:opacity-90 transition-all active:scale-95 shadow-lg"
        >
          {t("checkout.cancel.backToCart")}
        </Link>
      </motion.div>
    </div>
  );
}
