"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useUiPreferences } from "@/lib/ui-preferences";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useUiPreferences();

  return (
    <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[520px]">
        {/* Heading */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className={cn(
              integralCF.className,
              "text-2xl font-bold text-foreground tracking-wide",
            )}
          >
            IKA SUGU
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-4 mb-1">
            {t("auth.register.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.register.subtitle")}</p>
        </div>

        {/* Card */}
        <div className="border border-border rounded-[20px] p-7 md:p-10 bg-surface-card shadow-sm">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {/* First + Last name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.firstName")}
                </label>
                <input
                  type="text"
                  placeholder={t("auth.firstNamePlaceholder")}
                  className="w-full px-5 py-3 bg-surface-section text-foreground rounded-full text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-foreground/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.lastName")}
                </label>
                <input
                  type="text"
                  placeholder={t("auth.lastNamePlaceholder")}
                  className="w-full px-5 py-3 bg-surface-section text-foreground rounded-full text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-foreground/15 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("auth.emailLabel")}
              </label>
              <input
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                className="w-full px-5 py-3 bg-surface-section text-foreground rounded-full text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-foreground/15 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("auth.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.register.passwordPlaceholder")}
                  className="w-full px-5 py-3 bg-surface-section text-foreground rounded-full text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-foreground/15 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  aria-label={t("auth.togglePasswordVisibility")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("auth.register.confirmPasswordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder={t("auth.register.confirmPasswordPlaceholder")}
                  className="w-full px-5 py-3 bg-surface-section text-foreground rounded-full text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-foreground/15 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  aria-label={t("auth.togglePasswordVisibility")}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-foreground cursor-pointer shrink-0"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {t("auth.register.termsPrefix")}{" "}
                <Link href="#" className="text-foreground font-medium hover:underline">
                  {t("auth.register.termsLink")}
                </Link>{" "}
                {t("auth.register.termsAnd")}{" "}
                <Link href="#" className="text-foreground font-medium hover:underline">
                  {t("auth.register.privacyLink")}
                </Link>
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-foreground text-background rounded-full h-[52px] text-sm font-medium hover:bg-foreground/85 transition-colors"
            >
              {t("auth.register.submit")}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-1 border-t border-border" />
            <span className="px-4 text-xs text-muted-foreground">
              {t("auth.orContinueWith")}
            </span>
            <hr className="flex-1 border-t border-border" />
          </div>

          {/* Social */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-full text-sm font-medium text-foreground hover:bg-surface-section transition-colors"
          >
            <FcGoogle size={20} />
            {t("auth.continueWithGoogle")}
          </button>

          {/* Link to login */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.register.haveAccount")}{" "}
            <Link href="/login" className="text-foreground font-semibold hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
