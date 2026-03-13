"use client";

import Link from "next/link";
import { Package, Tag, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiPreferences } from "@/lib/ui-preferences";

const benefits = [
  {
    icon: Package,
    titleKey: "account.guest.benefit1.title",
    descKey: "account.guest.benefit1.desc",
  },
  {
    icon: Tag,
    titleKey: "account.guest.benefit2.title",
    descKey: "account.guest.benefit2.desc",
  },
  {
    icon: RotateCcw,
    titleKey: "account.guest.benefit3.title",
    descKey: "account.guest.benefit3.desc",
  },
];

export default function GuestAccountView() {
  const { t } = useUiPreferences();

  return (
    <div className="max-w-lg mx-auto">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("account.guest.title")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("account.guest.subtitle")}
        </p>
      </div>

      {/* Card */}
      <div className="border border-border rounded-[20px] bg-surface-card overflow-hidden">
        {/* Benefits */}
        <div className="p-6 md:p-8 space-y-5">
          {benefits.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-section flex items-center justify-center">
                <Icon size={18} className="text-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t(titleKey)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* CTAs */}
        <div className="p-6 md:p-8 space-y-3">
          <Button asChild className="w-full rounded-full h-12 text-sm font-medium">
            <Link href="/login">{t("account.guest.signIn")}</Link>
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            {t("account.guest.newHere")}{" "}
            <Link
              href="/register"
              className="text-foreground font-semibold hover:underline"
            >
              {t("account.guest.register")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
