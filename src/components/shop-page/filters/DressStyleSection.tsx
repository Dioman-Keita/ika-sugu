"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { MdKeyboardArrowRight } from "react-icons/md";
import { useUiPreferences } from "@/lib/ui-preferences";
import { translateAttribute } from "@/lib/i18n/messages";
import { useSearchParams } from "next/navigation";
import { DRESS_STYLE_OPTIONS } from "@/lib/catalog-options";

const DressStyleSection = () => {
  const { t, locale } = useUiPreferences();
  const searchParams = useSearchParams();

  const buildStyleHref = (style: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("style", style);
    params.delete("page");
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <Accordion type="single" collapsible defaultValue="filter-style">
      <AccordionItem value="filter-style" className="border-none">
        <AccordionTrigger className="text-foreground font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("shop.dressStyle")}
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0">
          <div className="flex flex-col text-muted-foreground space-y-0.5">
            {DRESS_STYLE_OPTIONS.map((style, idx) => (
              <Link
                key={idx}
                href={buildStyleHref(style)}
                className="flex items-center justify-between py-2"
              >
                {translateAttribute(style, locale)} <MdKeyboardArrowRight />
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default DressStyleSection;
