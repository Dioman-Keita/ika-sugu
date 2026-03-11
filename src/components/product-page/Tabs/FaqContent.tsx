"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useUiPreferences } from "@/lib/ui-preferences";

type FaqItem = {
  questionKey: string;
  answerKey: string;
};

const faqsData: FaqItem[] = [
  {
    questionKey: "product.faq.q1",
    answerKey: "product.faq.a1",
  },
  {
    questionKey: "product.faq.q2",
    answerKey: "product.faq.a2",
  },
  {
    questionKey: "product.faq.q3",
    answerKey: "product.faq.a3",
  },
  {
    questionKey: "product.faq.q4",
    answerKey: "product.faq.a4",
  },
  {
    questionKey: "product.faq.q5",
    answerKey: "product.faq.a5",
  },
  {
    questionKey: "product.faq.q6",
    answerKey: "product.faq.a6",
  },
];

const FaqContent = () => {
  const { t } = useUiPreferences();

  return (
    <section>
      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">
        {t("product.faq.title")}
      </h3>
      <Accordion type="single" collapsible>
        {faqsData.map((faq, idx) => (
          <AccordionItem key={idx} value={`item-${idx + 1}`}>
            <AccordionTrigger className="text-left">
              {t(faq.questionKey)}
            </AccordionTrigger>
            <AccordionContent>{t(faq.answerKey)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FaqContent;
