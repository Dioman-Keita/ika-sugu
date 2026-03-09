"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUiPreferences } from "@/lib/ui-preferences";
import { FooterLinks } from "./footer.types";

const LinksSection = () => {
  const { t } = useUiPreferences();

  const translatedData: FooterLinks[] = [
    {
      id: 1,
      title: t("footer.company"),
      children: [
        { id: 11, label: t("footer.about"), url: "#" },
        { id: 12, label: t("footer.features"), url: "#" },
        { id: 13, label: t("footer.works"), url: "#" },
        { id: 14, label: t("footer.career"), url: "#" },
      ],
    },
    {
      id: 2,
      title: t("footer.help"),
      children: [
        { id: 21, label: t("footer.customerSupport"), url: "#" },
        { id: 22, label: t("footer.deliveryDetails"), url: "#" },
        { id: 23, label: t("footer.terms"), url: "#" },
        { id: 24, label: t("footer.privacy"), url: "#" },
      ],
    },
    {
      id: 3,
      title: t("footer.faq"),
      children: [
        { id: 31, label: t("footer.account"), url: "#" },
        { id: 32, label: t("footer.manageDeliveries"), url: "#" },
        { id: 33, label: t("footer.orders"), url: "#" },
        { id: 34, label: t("footer.payments"), url: "#" },
      ],
    },
    {
      id: 4,
      title: t("footer.resources"),
      children: [
        { id: 41, label: t("footer.freeEbooks"), url: "#" },
        { id: 42, label: t("footer.devTutorial"), url: "#" },
        { id: 43, label: t("footer.howToBlog"), url: "#" },
        { id: 44, label: t("footer.youtube"), url: "#" },
      ],
    },
  ];

  return (
    <>
      {translatedData.map((item) => (
        <section className="flex flex-col mt-5" key={item.id}>
          <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">
            {item.title}
          </h3>
          {item.children.map((link) => (
            <Link
              href={link.url}
              key={link.id}
              className={cn([
                link.id !== 41 && link.id !== 43 && "capitalize",
                "text-black/60 dark:text-white/70 text-sm md:text-base mb-4 w-fit",
              ])}
            >
              {link.label}
            </Link>
          ))}
        </section>
      ))}
    </>
  );
};

export default LinksSection;
