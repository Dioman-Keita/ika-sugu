"use client";
import CategoriesSection from "@/components/shop-page/filters/CategoriesSection";
import ColorsSection from "@/components/shop-page/filters/ColorsSection";
import DressStyleSection from "@/components/shop-page/filters/DressStyleSection";
import PriceSection from "@/components/shop-page/filters/PriceSection";
import SizeSection from "@/components/shop-page/filters/SizeSection";
import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n/messages";
import { useUiPreferences } from "@/lib/ui-preferences";

const Filters = ({ locale = "en" }: { locale?: Locale }) => {
  const { t } = useUiPreferences();

  return (
    <>
      <hr className="border-t-border" />
      <CategoriesSection locale={locale} />
      <hr className="border-t-border" />
      <PriceSection />
      <hr className="border-t-border" />
      <ColorsSection />
      <hr className="border-t-border" />
      <SizeSection />
      <hr className="border-t-border" />
      <DressStyleSection />
      <Button
        type="button"
        className="bg-foreground text-background w-full rounded-full text-sm font-medium py-4 h-12"
      >
        {t("shop.applyFilter")}
      </Button>
    </>
  );
};

export default Filters;
