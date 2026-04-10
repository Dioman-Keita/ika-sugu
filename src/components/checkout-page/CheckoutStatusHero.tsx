"use client";

import Link from "next/link";
import * as motion from "framer-motion/client";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import type { LucideIcon } from "lucide-react";

type CheckoutStatusHeroProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "success" | "cancel";
  Icon: LucideIcon;
};

const toneStyles = {
  success: {
    badge: "bg-green-500/10 dark:bg-green-500/20",
    icon: "text-green-600 dark:text-green-400",
  },
  cancel: {
    badge: "bg-red-500/10 dark:bg-red-500/20",
    icon: "text-red-600 dark:text-red-400",
  },
} as const;

export default function CheckoutStatusHero({
  title,
  description,
  ctaLabel,
  ctaHref,
  tone,
  Icon,
}: CheckoutStatusHeroProps) {
  const styles = toneStyles[tone];

  return (
    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center mb-8",
          styles.badge,
        )}
      >
        <Icon className={cn("w-12 h-12", styles.icon)} />
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
          {title}
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">{description}</p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12"
      >
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center bg-foreground text-background rounded-full px-12 py-4 font-semibold text-base hover:opacity-90 transition-all active:scale-95 shadow-lg"
        >
          {ctaLabel}
        </Link>
      </motion.div>
    </div>
  );
}
