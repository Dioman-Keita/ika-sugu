"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { useUiPreferences } from "@/lib/ui-preferences";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useUiPreferences();

  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-[480px]">
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
              {t("auth.reset.successTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("auth.reset.successBody")}</p>
          </div>

          <div className="border border-border rounded-[20px] p-7 md:p-10 bg-surface-card shadow-sm">
            <Button asChild className="w-full rounded-full h-[52px]">
              <Link href="/login">{t("auth.reset.goToLogin")}</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[480px]">
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
            {t("auth.reset.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.reset.subtitle")}</p>
        </div>

        <div className="border border-border rounded-[20px] p-7 md:p-10 bg-surface-card shadow-sm">
          {errorParam ? (
            <AuthNotice variant="error">{t("auth.reset.invalidToken")}</AuthNotice>
          ) : null}
          {!token ? (
            <div className="space-y-5">
              <AuthNotice variant="error">{t("auth.reset.missingToken")}</AuthNotice>
              <Button asChild className="w-full rounded-full h-[52px]">
                <Link href="/forgot-password">{t("auth.reset.backToForgot")}</Link>
              </Button>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (isSubmitting) return;
                setError(null);
                if (newPassword !== confirmPassword) {
                  setError(t("auth.register.errors.passwordMismatch"));
                  return;
                }
                setIsSubmitting(true);
                try {
                  const { error } = await authClient.resetPassword({
                    token,
                    newPassword,
                  });
                  if (error) {
                    setError(error.message ?? String(error));
                    return;
                  }
                  setDone(true);
                  router.refresh();
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.reset.newPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder={t("auth.reset.newPasswordPlaceholder")}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.reset.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={t("auth.reset.confirmPasswordPlaceholder")}
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

              {error ? <AuthNotice variant="error">{error}</AuthNotice> : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-foreground text-background rounded-full h-[52px] text-sm font-medium hover:bg-foreground/85 transition-colors"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {t("auth.reset.submit")}
                  </span>
                ) : (
                  t("auth.reset.submit")
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
