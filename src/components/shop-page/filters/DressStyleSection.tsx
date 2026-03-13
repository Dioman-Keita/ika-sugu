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

type DressStyle = {
  title: string;
  slug: string;
};

const dressStylesData: DressStyle[] = [
  { title: "Casual", slug: "casual" },
  { title: "Formal", slug: "formal" },
  { title: "Party", slug: "party" },
  { title: "Gym", slug: "gym" },
];

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
            {dressStylesData.map((dStyle, idx) => (
              <Link
                key={idx}
                href={buildStyleHref(dStyle.slug)}
                className="flex items-center justify-between py-2"
              >
                {translateAttribute(dStyle.title, locale)} <MdKeyboardArrowRight />
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default DressStyleSection;
