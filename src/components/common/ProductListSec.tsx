"use client";
import * as motion from "framer-motion/client";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import ProductCard from "./ProductCard";
import { Product } from "@/types/product.types";
import Link from "next/link";
import { useUiPreferences } from "@/lib/ui-preferences";

type ProductListSecProps = {
  title?: string;
  titleKey?: string;
  data: Product[];
  viewAllLink?: string;
};

const ProductListSec = ({ title, titleKey, data, viewAllLink }: ProductListSecProps) => {
  const { t } = useUiPreferences();
  const resolvedTitle = titleKey ? t(titleKey) : (title ?? "");

  return (
    <section className="max-w-frame mx-auto text-center">
      <motion.h2
        initial={{ y: "100px", opacity: 0 }}
        whileInView={{ y: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={cn([
          integralCF.className,
          "text-[32px] md:text-5xl mb-8 md:mb-14 capitalize",
        ])}
      >
        {resolvedTitle}
      </motion.h2>
      <motion.div
        initial={{ y: "100px", opacity: 0 }}
        whileInView={{ y: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        {data.length === 0 && (
          <div className="w-full py-10 mb-6 md:mb-9 text-center border border-border rounded-[20px]">
            <p className="text-muted-foreground text-sm sm:text-base">
              {t("product.noProducts")}
            </p>
          </div>
        )}
        {data.length > 0 && (
          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full mb-6 md:mb-9"
          >
            <CarouselContent className="mx-4 xl:mx-0 space-x-4 sm:space-x-5">
              {data.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="w-full max-w-[198px] sm:max-w-[295px] pl-0"
                >
                  <ProductCard data={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
        {viewAllLink && data.length > 0 && (
          <div className="w-full px-4 sm:px-0 text-center">
            <Link
              href={viewAllLink}
              className="w-full inline-block sm:w-[218px] px-[54px] py-4 border rounded-full hover:bg-foreground hover:text-background text-foreground transition-all font-medium text-sm sm:text-base border-border"
            >
              {t("home.viewAll")}
            </Link>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default ProductListSec;
