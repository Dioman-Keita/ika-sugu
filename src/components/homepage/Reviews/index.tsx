"use client";

import React from "react";
import * as motion from "framer-motion/client";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { useIsClient, useMediaQuery } from "usehooks-ts";
import ReviewCard from "@/components/common/ReviewCard";
import { Review } from "@/types/review.types";
import { useUiPreferences } from "@/lib/ui-preferences";

type ReviewsProps = { data: Review[] };

const Reviews = ({ data }: ReviewsProps) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isClient = useIsClient();
  const { t } = useUiPreferences();

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  if (!isClient) return null;
  if (data.length === 0) {
    return (
      <section className="max-w-frame mx-auto px-4 xl:px-0 py-10 md:py-14">
        <h2 className={cn([integralCF.className, "text-[32px] md:text-5xl mb-4"])}>
          {t("home.reviewsTitle")}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("home.noReviews")}
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden py-10 md:py-14">
      <motion.div
        initial={{ x: "100px", opacity: 0 }}
        whileInView={{ x: "0", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
          }}
          className="relative w-full mb-6 md:mb-9"
        >
          <div className="relative flex items-end sm:items-center max-w-frame mx-auto mb-6 md:mb-10 px-4 xl:px-0">
            <motion.h2
              initial={{ y: "100px", opacity: 0 }}
              whileInView={{ y: "0", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className={cn([
                integralCF.className,
                "text-[32px] leading-9 md:text-5xl capitalize mr-auto",
              ])}
            >
              {t("home.reviewsTitle")}
            </motion.h2>
            <div className="flex items-center space-x-1 ml-2">
              <CarouselPrevious variant="ghost" className="text-2xl">
                <FaArrowLeft />
              </CarouselPrevious>
              <CarouselNext variant="ghost" className="text-2xl">
                <FaArrowRight />
              </CarouselNext>
            </div>
          </div>
          <CarouselContent>
            {data.map((review, index) => (
              <CarouselItem
                key={review.id}
                className="w-full max-w-89.5 sm:max-w-100 pl-5"
              >
                <ReviewCard
                  className="h-full"
                  data={review}
                  blurChild={
                    data.length >= 6 && (
                      <div
                        className={cn([
                          isDesktop
                            ? (current + 1 === count
                                ? 0
                                : current + 1 > count
                                  ? 1
                                  : current + 1) === index && "backdrop-blur-[2px]"
                            : (current === count ? 0 : current) === index &&
                              "backdrop-blur-[2px]",
                          isDesktop
                            ? (current === 1
                                ? count - 2
                                : current === 2
                                  ? count - 1
                                  : current - 3) === index && "backdrop-blur-[2px]"
                            : (current === 1
                                ? count - 1
                                : current === 2
                                  ? 0
                                  : current - 2) === index && "backdrop-blur-[2px]",
                          "absolute bg-foreground/5 right-0 top-0 h-full w-full z-10",
                        ])}
                      />
                    )
                  }
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </motion.div>
    </section>
  );
};

export default Reviews;
