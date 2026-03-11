"use client";
import { Button } from "@/components/ui/button";
import InputGroup from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import Image from "next/image";
import React from "react";
import { useUiPreferences } from "@/lib/ui-preferences";

const NewsLetterSection = () => {
  const { t } = useUiPreferences();

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 py-9 md:py-11 px-6 md:px-16 max-w-frame mx-auto bg-black dark:bg-zinc-800 rounded-[20px]">
      <p
        className={cn([
          integralCF.className,
          "font-bold text-[32px] md:text-[40px] text-white mb-9 md:mb-0",
        ])}
      >
        {t("newsletter.title")}
      </p>
      <div className="flex items-center">
        <div className="flex flex-col w-full max-w-[349px] mx-auto">
          <InputGroup className="flex bg-white dark:bg-zinc-700 mb-[14px]">
            <InputGroup.Text>
              <Image
                priority
                src="/icons/envelope.svg"
                height={20}
                width={20}
                alt="email"
                className="min-w-5 min-h-5 dark:invert"
              />
            </InputGroup.Text>
            <InputGroup.Input
              type="email"
              name="email"
              placeholder={t("newsletter.placeholder")}
              className="bg-transparent placeholder:text-black/40 dark:placeholder:text-white/40 dark:text-white placeholder:text-sm sm:placeholder:text-base"
            />
          </InputGroup>
          <Button
            variant="secondary"
            className="text-sm sm:text-base font-medium bg-white dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600 h-12 rounded-full px-4 py-3"
            aria-label={t("newsletter.button")}
            type="button"
          >
            {t("newsletter.button")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsLetterSection;
